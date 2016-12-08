const zlib = require('zlib');

module.exports = {
        compress: compress,
        decompress: decompress
};


function compress(options) {
    
    var options = options || null;
    
    return {
        clientRequest: function(req, next) {
            next();
        },

        serverResponse: function(res, next) {
            if( options
                && options['content-type']
                && res.headers['content-type'] 
                && !res.headers['content-type'].match(options['content-type'])) {}
            
            else if(res.headers['content-encoding'] && res.headers['content-encoding'] === 'gzip') {
                var gz = zlib.createGzip();
                res.plumb(gz);    
            }
        
            next();
        },

        configure: function(config) {
            options = config;
        },
        
        getConfig: function() { 
            return options;
        }
    };
}

function decompress(options) {
    
    var options = options || null;
    
    return {
        clientRequest: function(req, next) {
            next();
        },

        serverResponse: function(res, next) {
            if( options
                && options['content-type']
                && res.headers['content-type'] 
                && !res.headers['content-type'].match(options['content-type'])) {}
            
            else if(res.headers['content-encoding'] && res.headers['content-encoding'] === 'gzip') {
                var gunz = zlib.createGunzip();
                res.plumb(gunz);
            }
            
            next();
        },

        configure: function(config) {
            options = config;
        },
        
        getConfig: function() { 
            return options;
        }
    };
}