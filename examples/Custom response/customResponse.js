const modProxy = require('../../mod-proxy');
const customResponse = require('../../strategies/customResponse');
const compressor = require('../../strategies/compressor');

var conf = {
	
	// For awwwards.com domain 
   'awwwards.com': {
         '*': {	// For any path
            accept: {	// If the request contains an 'accept' header that matches the following
                'image/webp,image/.*': 'http://www.simplesite.com/images/frontPage/logo/US_Logo_300x40.png', // Send back an image from another domain 
            }
        }
    },
    
    // For prohibited.com domain
    'prohibited.com': [401, 'forbidden.html'],  // For any path and any headers, send 401 status code with custom local page
        
    
    // For adomain.com domain
    'adomain.com': {
        '/noEnter': 'http://www.proxyStop.com'   // For /noEnter path and any headers, request and send another page
    },
    
    // For site.com (any path and headers), send back 301 status with custom Location header, no body
    'site.com': [301, {Location: 'http://www.newlocation.com'}],
    
    //For simplesite.com domain
    'www.simplesite.com': {
        '/': 'forbidden.html',	// For the / path, send back the local file 'forbidden.html'
        '*': [302, {Location: 'http://www.google.com'}]	// For any other path, send 302 status code with custom Location header, no body
    }
};

//Create proxy with customResponse strategy
var server = modProxy.createProxy(customResponse(conf));

server.listen(8080);
