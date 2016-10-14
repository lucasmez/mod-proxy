const http = require('http');

var server = http.createServer();
server.on('request', (req, res) => {
    return;
});


module.exports = server;