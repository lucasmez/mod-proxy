const fs = require('fs');
const url = require('url');

module.exports = function customResponse(options) {
    var config = {};
    var strategy = {};
    
    strategy.configure = function(options) {
        if(Object.prototype.toString.call(options) !== "[object Object]") return false;
        config = options;
    };
    
    strategy.getConfig = function() {
        return config;
    }
    
    strategy.clientRequest = function(req, next) {
        var address, path, headers, parsedUrl;
        
        parsedUrl = url.parse(req.url);
        address = parsedUrl.hostname;
        path = parsedUrl.pathname;
        headers = req.headers;

        var actionObj = parseRequest(config, address, path, headers);
        
        if(!actionObj) return next();
        
        req.customResponse = {};
        
        if(actionObj.headers) {
            req.bypassOriginRequest = true;
            req.customResponse.statusCode = actionObj.statusCode || 200;
            req.customResponse.headers = actionObj.headers;
        }
        
        else if(actionObj.url) {
            req.url = actionObj.url;
            req.headers.host = url.parse(actionObj.url).hostname;
        }
        
        else if(actionObj.filePath) {
            // filePath has to be absolute address 
            var fileStream = fs.createReadStream(actionObj.filePath);
     
            // Default behavior: if file cannot be found, the original file will be requested
            fileStream.on('error', (err) => {       //TODO Fix, will this cause a race condition?
                req.bypassOriginRequest = false;
            });
            
            req.bypassOriginRequest = true;
            req.customResponse = fileStream;
            req.customResponse.statusCode = actionObj.statusCode || 200;
            req.customResponse.headers = {}; //TODO create headers based on file type(like express.static);
        }
        
        next();
       
    };
    
    strategy.serverResponse = function(res, next) {
        next();
    }
    
    strategy.configure(options || {});
    return strategy;
    
};


function parseRequest(config, address, path, headers) {
    addressObj = parseAddress(config, address);
    if(!addressObj) return null;
    
    if(Object.prototype.toString.call(addressObj) !== "[object Object]") {
        return getCustomAction(addressObj);
    }
        
    headersObj = parsePath(addressObj, path); 
    if(!headersObj) return null;
    
    if(Object.prototype.toString.call(headersObj) !== "[object Object]") {
        return getCustomAction(headersObj);
    }
    
    return getCustomAction(parseHeaders(headersObj, headers));
    

    /* Extract server path options from config object */
    function parseAddress(config, address) {
        return config[address] || config[address.replace("www.","")] || config['*'] || null;
    }
    
    /* Extract headers options from path options object */
    //TODO parse based on RegExp, like parseHeaders
    function parsePath(obj, path) {
        return obj[path] || obj['*'] || null;
    }
    
    /* Match header from headers object */
    function parseHeaders(configHeaders, reqHeaders) {
        var customRes = null;
        var headerKeys = Object.keys(reqHeaders);

        //TODO Can I make this more efficient?
        headerKeys.some( (key) => {
            if(!(key in configHeaders)) return false;
     
            for(var headerName in configHeaders) {
                if(!configHeaders.hasOwnProperty(headerName)) continue;
                
                for(var headerContent in configHeaders[headerName]) {
                    if(!configHeaders[headerName].hasOwnProperty(headerContent)) continue;
                    
                    headerContentPat = new RegExp(headerContent);
                    
                    if(headerContentPat.test(reqHeaders[key])) {
                        customRes = configHeaders[key][headerContent];
                        return true;
                    }
                }
            }
            
            return false;
        });
        
        return customRes;
    }
    
    /* Given an array or a string return an object containing the custom action.
     * Returned object properties: 'statusCode' => Number, http custom status code.
     * 'headers' => Object, response headers.
     * 'filePath' => String, path to file being returned.
     * 'url' => String, url to custom request.
     */
    function getCustomAction(action) {
        // Input formats: (statusCode is optional)
        // Case 1: "filepath OR url"
        // Case 2: [<statusCode>, {headers}]
        // Case 3: [<statusCode>, "filepath OR url"]
        
        if(!action) return null;
        
        var retObj = {};
        
        if(Array.isArray(action)) { // Case 2 or 3
            if(!action.length) return null;
            
            if(action.length === 2) {   // statusCode present
                retObj.statusCode = action[0];
                action = action.slice(1);
            }
          
            if(typeof action[0] === "string") { // Case 3
                if(url.parse(action[0]).protocol) // Is url?
                    retObj.url = action[0];
                else
                    retObj.filePath = action[0];
            }
            
            else if(Object.prototype.toString.call(action[0]) === "[object Object]") {  // Case 2
                retObj.headers = action[0];
            }
            
            else return null;
        }
        
        else if(typeof action === "string") {   // Case 1
             if(url.parse(action).protocol) // Is url?
                retObj.url = action;
             else
                retObj.filePath = action;
        }
        
        else {
            return null;
        }
        
        return retObj;
    }
    
}

