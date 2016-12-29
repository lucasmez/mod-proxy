mod-proxy
=======

`mod-proxy` is an HTTPS tunnel proxy and an HTTP proxy that can programmed through `express`-style middlewares to act as a simple transparent proxy, log and/or modify client requests and server responses.

### Table of Contents
* [General Concept](#general-concept)
* [Usage Examples](#usage-examples)
  * [Basic transparent proxy](#basic-transparent-proxy)
  * [Logging requests and responses](#logging-requests-and-responses)
  * [Writing and re-writing request headers](#writing-and-re-writing-request-headers)
  * [Sending custom documents or statuses to specific requests](#sending-custom-documents-or-statuses-to-specific-requests)
  * [Modifying server responses using jQuery-style selectors](#modifying-server-responses-using-jquery-style-selectors)
* [Strategies](#strategies)
  * [Using Strategies](#using-strategies)
  * [mod-proxy's Native Strategies](#mod-proxys-native-strategies)
    * [Default](#default)
    * [Compressor](#compressor)
    * [Custom Response](#custom-response)
    * [Modifier](#modifier)
  * [Writing Strategies](#writing-strategies)
* [Middlewares](#middlewares)
* [Clients](#clients)
* [Test](#test)

### General Concept

To create a new proxy call `createProxy` with an optional [strategy](#strategies) argument.
To start the proxy, call `listen`.

```javascript
const modProxy = require('mod-proxy');

var proxyServer = modProxy.createProxy(strategy);

proxyServer.listen(port);
```

The object returned, in the above example `proxyServer`, inherited from node's `http.Server` and will contain six additional methods:

* `req(parallel, cb)`: The cb callback have access to the client's incoming request, of type `http.IncomingMessage`.
* `res(parallel, cb)`: The cb callback have access to the server's response, of type `http.ServerResponse`. 
* `addClient(address_port, strategy)`: Add a [client](#clients) with a custom strategy.
* `getClient(address_port)`: Get a client's strategy
* `changeDefaultMode(strategy)`: Change the default strategy.
* `configure()`: Wrapper to the current default mode's (strategy's) configuration function. 


To work on the clients' requests and servers' responses call `req` and `res` in a middleware-style fashion. They can be chained if desired:

```javascript
proxyServer
	.req( (request, next) => {	//request is of type http.IncomingMessage
		console.log("New request incoming...");
		next();
	})
	.res( (response, next) => {	//response is of type http.ServerResponse
		console.log("Sending server response...");
		next();
	});
```

You can also use ready-made [strategies](#strategies):

```javascript
const customResponse = require('mod-proxy/strategies/customResponse');
const configJSON = require('./responseConfig');

proxyServer.changeDefaultMode(customResponse(JSON.parse(configJSON)));
```

### Usage Examples

#### Basic transparent proxy

```javascript
const modProxy = require('mod-proxy');

var server = modProxy.createProxy().listen(8080);
```
#### Logging requests and responses

```javascript
const modProxy = require('mod-proxy');

var server = modProxy.createProxy();

server
	.req( (req, next) => {
		console.log("\nRequest from: ", req.socket.remoteAddress);
		console.log("requires resource from host: ", req.headers.host);
		next();
	})

	.res( (res, next) => {
		console.log("Sending server response with the headers: ", res.headers );
		next();
	})

	.listen(8080);
```

#### Writing and re-writing request headers
```javascript
const modProxy = require('mod-proxy');

var server = modProxy.createProxy();

server
	.req( (req, next) => {
		req.headers['Cookie'] = 'name=myName';
		req.headers['X-proxy'] = 'modProxy';
		next();
	})
	
	.listen(8080);
```

#### Sending custom documents or statuses to specific requests

Use the [strategy](#strategies) `customResponse` to send back custom resources and/or statuses to specific requests:

```javascript
const modProxy = require('mod-proxy');
const customResponse = require('mod-proxy/strategies/customResponse');

var config = {
	'www.somewebsite.com': [401, 'youShallNotPass.html'],	//Send back custom local file with 401 status code

	'www.anotherwebsite.com': {
		'/noEnter': [404, 'www.externalSite.com/nothingHere.html'] //Request and send resource from another domain
	}
};

var server = modProxy.createProxy(customResponse(config));

// OR (change default strategy after server has been created)
//var server = modProxy.createProxy();
//server.changeDefaultMode(customResponse(config));

// OR (use strategy with middleware-style functionality)
//var server = modProxy.createProxy();
//var customRes = customResponse(config);
//server.req( customRes.clientRequest );

server.listen(8080);
```

#### Modifying server responses using jQuery-style selectors

Use the [strategy](#strategies) `modifier` to modify server responses using jQuery-style selectors before sending them back to the client. The `compressor` strategy is also used to decompress gzipped resources to make them readable to `modifier` and then re-compress them before they are sent back to the client.

```javascript
const modProxy = require('mod-proxy');
const modifier = require('mod-proxy/strategies/modifier');
const compressor = require('mod-proxy/strategies/compressor');


//Configure compressor to only decompress html files
var decompress = compressor.decompress({
    'content-type' : /.*text\/html.*/
});
 
//Configure compressor to only compress html files
var compress = compressor.compress({
    'content-type' : /.*text\/html.*/
});

var mod = modifier(); //Create modifier
var $ = mod.$;	//Get access to its selector function

//jQuery-style modifications applied to every html server response
$('title').prepend('My Title - ');
$('.class1').replaceWith("<h1>Replaced</h1>");
$('#id1').after("<h1>After id1</h1>").before("<h1>Before id1</h1>");

var server = modProxy.createProxy();

server
	.res(decompress.serverResponse)		//Decompress response if needed
	.res(mod.serverResponse)		//Make modifications 
	.res(compress.serverResponse)		//Re-compress responses that were decompressed earlier

	listen(8080);
```

### Strategies
A Strategy is a method that returns an object containing a `req` and/or a `res` [middlewares](#middlewares). It was inspired by `express`'s `app.use` although relatively limited in flexibility and functionality.

#### Using Strategies
To create a strategy call its exported method with any required arguments:

```javascript
const strat = require('./myStrategy');

var strategy = strat(options);
```

There are three ways to use a strategy:

- **When creating the proxy using `createProxy`**: This will set the default proxy mode (another word for strategy) to the argument passed to `createProxy`. Any `req` and  `res` middlewares the strategy contains will be used automatically.
- **Changing the default strategy**: Call the server's `changeDefaultMode` method with a strategy argument to change its default mode after the server has been created with `createProxy`.
- **Use strategy methods as middlewares**: This provides the greater flexibility. Every strategy will contain two methods: `clientRequest` and `serverResponse`. These are used as the callbacks to  `req` and `res` (See [middlewares](#middlewares)) respectively. Some strategies have and must use both middlewares to function correctly, so be careful when using this method and check the strategy's documentation.

```javascript
const modProxy = require('mod-proxy');
const strat = require('./myStrategy');

//First way
var server = modProxy.createProxy(strat(options));

//Second way
var server = modProxy.createProxy();
server.changeDefaultMode(strat(options));

//Third way
var server = modProxy.createProxy();
var strategy = strat(options);
server
	.req( strategy.clientRequest );		//If present
	.res( strategy.serverResponse );	//If present
```

#### Mod-proxy's Native Strategies
Mod-proxy's native strategies are inside the *strategies* folder.

##### Default
This is an empty strategy that is used internally when `createProxy` is called without an argument. It also serves as a skeleton to follow if you wish to create your own.

##### Compressor
Most resources are compressed using gzip before they are sent from server to client. If you wish to modify or parse those files before fowarding them to the client, decompressing them into a readable format would be useful. This strategy uses node's `zlib` module to decompress and compress files.
`compressor` exports an object containing two strategies:

```javascript
const modProxy = require('mod-proxy');
const compressor = require('mod-proxy/strategies/compressor');

var decompress = compressor.decompress(options);	//Create decompress strategy
var compress = compressor.compress(options);		//Create compress strategy

var server = modProxy.createProxy();

server
	.res(decompress.serverResponse)	//Decompress response
	.res(compress.serverResponse);	//Re-compress responses that were decompressed earlier
```

Both strategies (`decompress` and `compress`) accept an optional options object argument which must contain the property `content-type` with a RegExp value. This value will be matched with the server responses' *content-type* header. If it is a match, the resource will only me compressed or decompressed if the header *content-encoding=gzip* is also present:

```javascript
//Configure compressor to only decompress html files
var decompress = compressor.decompress({
    'content-type' : /.*text\/html.*/
});
 
//Configure compressor to only compress html files
var compress = compressor.compress({
    'content-type' : /.*text\/html.*/
});
```

##### Custom Response
This strategy can be used if you wish to block access to certain pages, resources or a whole website by sending custom HTTP status code to the client, replace a webpage or resource with another custom resource stored in the local machine or any other web server and more.
To create this strategy you must pass to it an object argument containing the desired configuration:

```javascript
const modProxy = require('mod-proxy');
const customResponse = require('mod-proxy/strategies/customResponse');

var server = modProxy.createProxy(customResponse(config));
```

The *config* object must follow the rules:

- Each property name must be the name of a domain. e.g.: 'http://www.website.com' or 'www.website.com'.
- The value of each domain property can be either an array, a string or an object:
  - **Array**: This configuration will be applied to the entire domain, regardless of path. The first element of the array contains the HTTP Status Code returned to the client. The next element is a string containing either the name of a local file or another resource (can be from another domain) to be sent to the client, or an object containing properties and values that will be added as or replace HTTP headers and its values respectively. e.g.: 
www.somesite.com: [404, '404Error.html'] AND 
www.anothersite.com: [301, {Location: 'http://www.newlocation.com'}].
  -  **String**: This configuration will be applied to the entire domain, regardless of path. The string contains either the name of a local file or another resource (can be from another domain) to be sent to the client. An HTTP status code of 200 is sent by default.
e.g.: www.somesite.com: 'http://www.anothersite.com/page.html'.
  - **Object**: Each property of this object is a string containing the specific url path to which the configuration is to be applied. '*' is used to match any path. The value for each property can again be an array, a string or an object. The first two cases are exactly the same as described above. If the value is an object each of its properties must be a string containing an HTTP header ('accept', 'user-agent', etc). The value for each property will also be an object and its properties must be a string that will later be converted into a RegExp. This regular expression will hold the value of the HTTP header and will be matched against every client request. See below for examples.

Examples will make things clearer:
```javascript
var config = {

	// For somesite.com domain 
	'www.somesite.com': [401, 'forbidden.html'], // For any path and any headers, send 401 status code with a custom local page

	// For oldsite.com domain
	'http://www.oldsite.com': {
		'/redirection': [301, {Location: 'http://www.newlocation.com'}] // For the path /redirection and any headers, send back 301 status code with custom Location header, no body.
	},

	// For newsite.com domain
	'www.newsite.com': 'http://www.someotherdomain.com/index.html', // For any path and headers, send back a resource from another domain

	// For anothersite.com domain
	'www.anothersite.com': {
		'*': {	// For any path
			accept: {	// If the request contains an 'accept' header that matches the following RegExp
				'image/webp,image/.*': 'http://www.someotherdomain/image.png', // Send back an image from another domain 
			}
		}
	}	

}

customResponse(config);
```

##### Modifier
If you want to modify the server's response HTML before sending it to the client using a jQuery-style selector, use this strategy. It makes use of the module `html-injector` which is a stream implementation of a subset of `cheerio`. You must decompress the HTML file before using the modifier. The Compressor strategy is suitable for this.

To create the strategy, call the exported method without any arguments. The returned object contains a method `$`, which is used similarly to the jQuery selector, although with limited functionality (See [html-injector](https://github.com/lucasmez/html-injector)).

```javascript
const modProxy = require('mod-proxy');
const modifier = require('mod-proxy/strategies/modifier');
const compressor = require('mod-proxy/strategies/compressor');

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
	.res(decompress.serverResponse)	//Decompress response if needed
	.res(mod.serverResponse)	//Make modifications 
	.res(compress.serverResponse)	//Re-compress responses that were decompressed earlier

	.listen(8080);
```

#### Writing Strategies
Coming soon.
See [middlewares](#middlewares).

### Middlewares
Coming soon.

### Clients
Coming soon.

### Test

Tests are not yet complete.

```
$ npm test
```
