const modProxy = require('../../mod-proxy');


var server = modProxy.createProxy();
server.listen(8080, () => {
    console.log("Proxy listening on port ", 8080);
});
