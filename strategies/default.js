module.exports = function() {
    return {
        clientRequest: function(req, next) {
            next();
        },

        serverResponse: function(res, next) {
            next();
        },

        configure: function() {},
        
        getConfig: function() { return null; }
    };
};