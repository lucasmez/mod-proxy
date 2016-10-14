const http = require('http');

module.exports = function makeRequest(server, method, path, cb) {
    var port = 8081;
    
    // Create server to make request to
    server.listen(port, () => {
        // Make request
        http.request({
            port: port,
            method: method,
            path: path
        }, (res) =>{
            res.body = "";
            res.on('error', err =>{
                server.close();
                cb(err, res); 
            });
            res.on('data', data =>{
                res.body += data;
            });
            res.on('end', () => {
                server.close();
                cb(res); 
            });
            
        });
    });
    
}