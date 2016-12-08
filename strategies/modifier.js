const stream = require('stream'),
      util = require('util'),
      modifier = require('../lib/html-injector/html-injector');


module.exports = function(options) {
    
    var strategy = {};
    var mod = null;
    
    strategy.configure = function(options) {
        mod = options;
    };
    
    strategy.getConfig = function() {
        return mod;
    };
    
    strategy.clientRequest = function(req, next) {
        next();
    };
    
    strategy.serverResponse = function(res, next) {
        if(res.headers['content-type'] && res.headers['content-type'].match(/.*text\/html.*/)) {
            var lastConf = mod.getModifiers();
            mod = modifier();
            mod.setModifiers(lastConf);

            res.plumb(mod);
        }
        
        next();
    };
    
    strategy.configure(modifier(options));
    
    strategy.$ = mod.$;
    
    return strategy;
};
