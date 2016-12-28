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

* `req(parallel, fn)`: Provide access to the client's incoming request, of type `http.IncomingMessage`.
* `res(parallel, fn)`: Provide access to the server's response, of type `http.ServerResponse`. 
* `addClient(address_port, strategy)`: Add a web client with a custom strategy.
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

proxyServer.changeDefaultMode(customResponse(configJSON));
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

Use the [strategy](#strategies) `modifier` to send back custom resources and/or statuses to specific requests. The `compressor` strategy is also
used to decompress gzipped resources to make them readable to `modifier` and then re-compress them before they are sent back to the client.

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

Coming soon.

### Clients

Coming soon.

### Test

Tests are not yet complete.

```
$ npm test
```
