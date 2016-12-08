const spyProxy = require('../spy-proxy');
const modifier = require('../strategies/modifier');
const customRes = require('../strategies/customResponse');
const compressor = require('../strategies/compressor');

var custom = customRes({
    'site.com': [200, 'forb.html']
});
 
var decompress = compressor.decompress({
    'content-type' : /.*text\/html.*/
});
 
var compress = compressor.compress({
    'content-type' : /.*text\/html.*/
});

var mod = modifier("MOD");

mod.$('.box-info').prepend("PREPENDING!!!!!!!");
mod.$('img').replaceWith('<a id="my_id">TESTING IMAGE</a>')
mod.$('title').prepend('MY TITLE');
mod.$('.inner').prepend("<h1>INSERTED</h1>");
mod.$('.widgets').replaceWith("<h1>INSERTED</h1>");
mod.$('#testimonials').prepend("<h1>INSERTED</h1>");
mod.$('#promotion').after("<h1>INSERTED</h1>").before("<h1>INSERTED</h1>");
mod.$('.container').append("<h1>INSERTED</h1>");

var server = spyProxy.createProxy();

server
    .req(custom.clientRequest)

    .res(decompress.serverResponse)
    .res(mod.serverResponse)
    .res(compress.serverResponse)

    .listen(8080);