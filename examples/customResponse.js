const spyProxy = require('../spy-proxy');
const customResponse = require('../strategies/customResponse');
const compressor = require('../strategies/compressor');

var conf = {
    // For all server addresses
    /*
    '*': { 
        '*': { // For all paths
            accept: {   // Return custom html, image and js
                'image/webp,image/.*': [404, 'pager.png']
            },
            cookie: {   // If cookie is set
                'userid=Lucas': 'public/denied.html'
            }
        }

    },
    */
    
    'localhost': {
        '*': {
            accept: {
                'image/webp,image/.*': 'http://www.simplesite.com/images/frontPage/logo/US_Logo_300x40.png',
            }
        }

    }, 
    
    'awwwards.com': {
         '*': {
            accept: {
                'image/webp,image/.*': 'http://www.simplesite.com/images/frontPage/logo/US_Logo_300x40.png',
            }
        }
    },
    
    // For prohibited.com server
    'prohibited.com': [401, 'public/forbidden.html'],  // For any path and any headers, send 401 status with custom page
        
    
    // For adomain.com server
    'adomain.com': {
        '/noEnter': 'http://www.proxyStop.com'   // For /noEnter path and any headers, request another page
    },
    
    // For site.com (any path and headers), send back 301 status with custom headers, no body
    'site.com': [301, {Location: 'http://www.newlocation.com'}],
    
    
    'www.simplesite.com': {
        '/': 'forb.html',
        '*': [302, {Location: 'http://www.google.com'}]
    }
};

var server = spyProxy.createProxy(customResponse(conf));

server.res(compressor.compress().serverResponse)
server.res(compressor.decompress().serverResponse);

server.listen(8080);
