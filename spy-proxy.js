"use strict";

const http = require('http'),
      util = require('util'),
      request = require('request'),
      
module.exports = Proxy;

// Factory for Proxy()
module.exports.createProxy = function(strategy) {
    return new Proxy(strategy);
};

function Proxy(strategy) {
    http.Server.call(this);
    
    this._clients = [];
    this._defaultMode = strategy;
    this.on('request', _requestEventHandler.bind(this));
}

util.inherits(Proxy, http.Server);

Proxy.prototype.addClient = function(address_port, strategy) {
    this._clients[address_port] = strategy;
};

Proxy.prototype.changeDefaultMode = function(strategy) {
    this._defaultMode = strategy;
};

Proxy.prototype.configure = function() {
    this._mode.configure.apply(this._mode, arguments);
};

Proxy.prototype.get = function(fn) {
    
};

Proxy.prototype.res = function(fn) {
    
};


//==============Private functions===============
function _requestEventHandler(req, res) {
    var mode = this._defaultMode;
    
    // Check if https....
    if(req.socket.address().port === 443) {
    
    }
    
    // Check for custom client strategy
    if(this._clients[req.host]) {
        mode = this._clients[req.host];
    }
    
    // Dispatch
    function next() {
        
    }
    
    // clientRequest and serverResponse functions are going to be middleware
    mode && mode.clientRequest(req, next);
    
}