module.exports.clientRequest = function(req, next) {
    //....
    next();
}

module.exports.serverResponse = function(res, next) {
    //...
    next();
}

module.exports.configure = function() {
    
}