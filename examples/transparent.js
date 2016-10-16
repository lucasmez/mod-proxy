const spyProxy = require('../spy-proxy');

var server = spyProxy.createProxy();
server.listen(8080, () => {
    console.log("Proxy listening on port ", 8080);
});

//server.listen(443);  // Catch https requests ?

server.req( (req, next) => {
    console.log("Request hook made: ", req.url); 
    next();
});
