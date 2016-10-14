const spyProxy = require('../spy-proxy');

var server = spyProxy.createProxy();
server.listen(8080);
server.listen(443);  // Catch https requests ?