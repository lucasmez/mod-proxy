"use strict";

const http =            require('http'),
      net =             require('net'),
      util =            require('util'),
      url =             require('url'),
      hookIt =          require('./lib/hookIt'),
      defaultStrategy = require('./strategies/default');
      
      
module.exports = Proxy;

// Factory for Proxy()
module.exports.createProxy = function(strategy) {
    return new Proxy(strategy);
};

function Proxy(strategy) {
    http.Server.call(this);
    
    this._clients = {};
    this._defaultMode = hookIt(strategy || defaultStrategy());
    _reorderLastHook(this._defaultMode);
    this.on('request', _requestEventHandler.bind(this));
    this.on('connect', _tunnelToHTTPS);
}

util.inherits(Proxy, http.Server);

Proxy.prototype.addClient = function(address_port, strategy) {
    var clientMode = hookIt(strategy || defaultStrategy());//DEFAULT_MODE_CONSTRUCTOR(this._defaultMode.getConfig())); //TODO
    clientMode.req = Proxy.prototype.req;
    clientMode.res = Proxy.prototype.res;
    _reorderLastHook(clientMode);
    this._clients[address_port] = clientMode;
    return clientMode;
};

Proxy.prototype.getClient = function (address_port) {
    return this._clients[address_port] || _getClientFromPattern.call(this, address_port) || null;
};

Proxy.prototype.changeDefaultMode = function(strategy) {
    this._defaultMode = strategy;
};

Proxy.prototype.configure = function() {
    this._defaultMode.configure.apply(this._defaultMode, arguments);
};

Proxy.prototype.req = function(parallel, fn) {
    var modeObj = this._defaultMode || this;
    if(typeof parallel === "function") {
        fn = parallel;
        parallel = false;
    }
    
    modeObj.after('clientRequest', fn, parallel);
    _reorderLastHook(modeObj, 'clientRequest');
    return this;
};

Proxy.prototype.res = function(parallel, fn) {
    var modeObj = this._defaultMode || this;
    if(typeof parallel === "function") {
        fn = parallel;
        parallel = false;
    }
    
    modeObj.after('serverResponse', fn, parallel);
    _reorderLastHook(modeObj, 'serverResponse');
    return this;
};


//==============Private functions===============
function _requestEventHandler(req, res) {
    req.pause(); // Give hooks time to operate before _sendRequestToOrigin.  Is this necessary?
    
    res.on('error', (err) => {
       console.error("Error sending response back to client", err.message, err.stack); 
    });
    
    // Check for custom client strategy
    var mode = this.getClient(req.host) || this._defaultMode;
    
    req.clientResponse = res; // Make res visible for _sendResponseToClient()
    
    // Iterate through all request hooks added with req(), the mode's clientRequest()
    // and _sendRequestToOrigin()
    mode.clientRequest(req);
    
}

// Switch last and second to last function hooks
function _reorderLastHook(strategy, fn) {
    // Case 1: If there are no after hooks, add _sendRequestToOrigin as one.
    // Case 2: If there is just one hook (which should be _sendRequestToOrigin), do nothing.
    // Case 3: If there is more than one hook, switch the positions of the last two.
    
    if(fn === undefined) { // Reorder both
        reorder('clientRequest');
        reorder('serverResponse');
    }
    else {
        reorder(fn);
    }
    
    function reorder(fnName) {
        var lastHook = strategy.popAfter(fnName); // Get last added hook
        var hasMoreHooks = strategy.popAfter(fnName); // Remove _sendRequestToOrigin or _sendResponseToClient
        var fn = fnName === "clientRequest" ? _sendRequestToOrigin.bind(strategy) : _sendReponseToClient;
        if(hasMoreHooks) strategy.after(fnName, lastHook); // Re-add last hook
        strategy.after(fnName, fn);
    }
    
}

// Send request to origin server
function _sendRequestToOrigin(clientRequest) {
    // 'this' was bound to the correct strategy in _reorderLastHook()
    
    if(clientRequest.bypassOriginRequest) {
        clientRequest.customResponse.clientResponse = clientRequest.clientResponse; // Make clientResponse visible for _sendResponseToClient()
        _createPlumb(clientRequest.customResponse); //Add .plumb() to response
        return this.serverResponse(clientRequest.customResponse); //TODO handle case where customResponse is not present. throw error?
    }
    
    var options = url.parse(clientRequest.url);
    options.method = clientRequest.method;
    options.headers = clientRequest.headers;
    
    var req = http.request(options, (originResponse) => {
        originResponse.clientResponse = clientRequest.clientResponse; // Make clientResponse visible for _sendResponseToClient()
        _createPlumb(originResponse); //Add .plumb() to response
        originResponse.pause(); // Pause response so asynchronous hooks have a chance to operate on it. 
            
        // Iterate through all response hooks added with res(), the mode's serverResponse()
        // and _sendResponseToClient()
        this.serverResponse(originResponse);
    });
    
    req.on('error', () => {
        //TODO Allow custom error response
        console.error("Error making request to origin");
        clientRequest.clientResponse.write("Error making request to origin", 'utf-8');
        clientRequest.clientResponse.end();
    });
    
    clientRequest.pipe(req);
}

function _sendReponseToClient(originResponse) {
    var res = originResponse.clientResponse;
    res.writeHead(originResponse.statusCode, originResponse.headers);
    
    // Check if originResponse is a stream
    if(!originResponse.on || !originResponse.read)
        res.end();
    
    else if(originResponse.customResponse) 
        originResponse.customResponse.pipe(res);
    
    else 
        originResponse.pipe(res);
}

function _getClientFromPattern(pattern) {
    var keys = Object.keys(this._clients);
    keys.forEach( (address_port) => {
        if(Object.prototype.toString.call(address_port) === "[object RegExp]") {
            if(address_port.test(pattern)) {
                return this._clients[address_port];
            }
        }
    });
    return false;
}

function _createPlumb(stream) {
    stream.plumb = function(newStream) {
        
        if(!newStream.on || !newStream.read) //If argument is NOT a stream
            throw new Error("Argument is not a stream");
        
        if(stream.customResponse) {
            stream.customResponse.pipe(newStream);
            stream.customResponse = newStream;
        }
        
        else {
            stream.customResponse = newStream;
            stream.pipe(newStream);
        }
        
    };
}

function _tunnelToHTTPS(clientRequest, clientSocket, headers) {
    var originUrl = url.parse("https://" + clientRequest.url);
    // Create new TCP connection to origin
    var originSocket = net.connect(originUrl.port, originUrl.hostname, () => {
        // Let client know connection was established
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                        //'Proxy-agent: Node-Proxy\r\n' +
                        '\r\n');
        
        // Send client request headers to origin
        originSocket.write(headers);
        
        // Create client - origin pipes
        originSocket.pipe(clientSocket);
        clientSocket.pipe(originSocket); 
    });
}
