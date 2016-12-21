const modProxy = require('../mod-proxy');
const modifier = require('../strategies/modifier');
const compressor = require('../strategies/compressor');


//Configure compressor to only decompress html files
var decompress = compressor.decompress({
    'content-type' : /.*text\/html.*/
});
 
//Configure compressor to only compress html files
var compress = compressor.compress({
    'content-type' : /.*text\/html.*/
});

var mod = modifier();
var $ = mod.$;

//Setup HTML modifications, jQuery style
$('title').prepend('My Title - ');
$('.inner').prepend("<h1>inner Prepended</h1>");
$('.widgets').replaceWith("<h1>Replaced/h1>");
$('#testimonials').prepend("<h1>testimonials prepended</h1>");
$('#promotion').after("<h1>After promotion</h1>").before("<h1>Before promotion</h1>");
$('.container').append("<h1>Appended to container</h1>");

//Create server
var server = modProxy.createProxy();

server
	
    .req( (req, next) => {	//Output url of all requests for debugging
        console.log("\nRequest: ", req.url);
        next();
    })
  

    .res( (res, next) => {	//Output headers of all server responses for debugging
        console.log("\nResponse: ", res.headers);
        //res.pipe(process.stdout);
        next();
    })
    .res(decompress.serverResponse)	//Decompress response if needed
    .res(mod.serverResponse)		//Make modifications 
    .res(compress.serverResponse);	//Re-compress responses that were decompressed earlier


server.listen(8080);
