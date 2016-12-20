const spyProxy = require('../spy-proxy');


var server = spyProxy.createProxy();
server.listen(8080, () => {
    console.log("Proxy listening on port ", 8080);
});
