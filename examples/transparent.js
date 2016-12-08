const spyProxy = require('../spy-proxy');
const zlib = require('zlib');
const cheerio = require('cheerio');
const stream = require('stream');

const modifier = require('../strategies/modifier');
var mod = modifier();


var server = spyProxy.createProxy();
server.listen(8080, () => {
    console.log("Proxy listening on port ", 8080);
});

var justSend = false;

server.req( (req, next) => {
     next();
    /*console.log("Request hook made: ", req.url); 
    console.log("Contents: \n");
    var gunz = zlib.createGunzip();
    gunz.on('error', (err) => {
       console.log("Error unziping"); 
    });
    req.on('data', data => {
        gunz.write(data);
    });
    
    gunz.on('data', data => {
       process.stdout.write(data, 'utf-8'); 
    });

    req.pause();*/

});


// Gunzip
server.res( (res, next) => {

    if(!(res.headers['content-type'] && res.headers['content-type'].match('text/html')) || justSend) {
        return next();
    }
    
    var body = [];
    
    
    if(res.headers['content-encoding'] && res.headers['content-encoding'] === 'gzip') {
    
        console.log("Source: " + res.url + "Start unzipping.");

        var gunz = zlib.createGunzip();

        gunz.on('data', data => {
            body.push(data);
        });

        gunz.on('end', () => {
            console.log("Done unzipping.");
            res.body = body.join('');
            next();
        });

        gunz.on('error', (err) => {
            console.log("Error gunzipping. ", err);
        });


        res.on('data', data => {
            gunz.write(data);
        });
        
        res.on('error', (err) => {
            console.error("Error with origin reposne"); 
        });
        
        res.on('end', () => {
           gunz.end(); 
        });
    }
    
    else {
        res.on('data', data => {
            body += data;
        });
        
        res.on('error', (err) => {
           console.error("Error with origin reposne"); 
        });
        
        res.on('end', () => {
            res.body = body;
            next();
        });
    }
    
    res.resume();

});

// Modify
mod.$('#promotion').prepend("HI THERE TSETING THIS !!!");
server.res(mod.serverResponse);

// Gzip and send
server.res( (res, next) => {
    if(!(res.headers['content-type'] && res.headers['content-type'].match('text/html')) || justSend) {
        return next();
    }
    
    console.log("Sending");
    
    res.clientResponse.statusCode = res.statusCode;
    for(var head in res.headers) {
        if(!res.headers.hasOwnProperty(head)) continue;
        res.clientResponse.setHeader(head, res.headers[head]);
    }   
    
    res.clientResponse.setHeader('content-encoding', 'utf-8');
    res.clientResponse.writeHead(res.statusCode);
    
    var body = res.body;
    
    /*if(res.headers['content-encoding'] && res.headers['content-encoding'] === 'gzip') {
        console.log("zipping.");
        zlib.gunzip(res.body, (err, bodyUn) => {
            if(err) console.log("Error during zipping. ", err);
            body = bodyUn;
        });
    }*/
    
    function SendStream(options) {
        if(!(this instanceof SendStream)) {
            return new SendStream(options);
        }
        stream.Readable.call(this, options);
    }
    
    SendStream.prototype = Object.create(stream.Readable.prototype);
    
    SendStream.prototype._read = function(n) {
        this.push(body);
    }
    
    SendStream({encoding: 'utf-8'}).pipe(res.clientResponse);
    
});