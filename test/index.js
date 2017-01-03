const assert = require('assert'),
      fs = require('fs'),

      request = require('supertest'),

      mockServer = require('./mock_server'),
      spyProxy = require('../mod-proxy'),
      makeRequest = require('./request-helper');

describe('clientRequest and serverResponse middlewares', () => {
    var proxy;
    
    before( () => {
        // Start in default transparent mode
        proxy = spyProxy.createProxy();
    });
    
    it('can add one clientRequest middleware', (done) => {
        var expected;
        // Change request url
        proxy.req( (req, next) => {
            req.url = '/index';
            req.headers.accept = 'text/html';
            next();
        });
        
        // Get expected response from origin server
        makeRequest(mockServer, 'GET', '/index', (err, res) => {
            assert.ifError(err);
            expected = res.body.toString();
            
            // Make request to proxy
            request(proxy)
                .get('/someRoute')
                .set('Accept', 'image/png')
                .expect(200)
                .expect(new RegExp(expected), done);
        });

    });
    
    // THIS ASSUMES it()'s RUNS SEQUENTIALLY AND NOT IN PARALLEL
    it('can add multiple clientRequests middlewares', () => {
        // Add another clientRequest middleware
        proxy.req( (req, next) => {
            assert(req.url, "/index");
            assert(req.headers.accept, "text/html");
            next();
        });
    });
    
    it('can add one clientResponse middleware', (done) => {
        proxy.res( (res, next) => {
            
        });
        assert.fail("", "", "not implemented", null);
    });
    
    // THIS ASSUMES it()'s RUNS SEQUENTIALLY AND NOT IN PARALLEL
    it('can add multiple clientResponse middlewares', (done) => {
        assert.fail("", "", "not implemented", null);
    });
    
    after( () => {
        proxy.close();
    });
    
});

/*==============================================================*/
describe('HTTPS', () => {

    it('always uses the transparent proxy strategy for https requests', (done) => {
        assert.fail("", "", "not implemented", null);
    });
    
    it('correctly fowards and responds to https requests', (done) => {
        assert.fail("", "", "not implemented", null);
    });
    
});

/*==============================================================*/
describe('Strategies', () => {
    
    describe(' - Simple transparent proxy', () => {
        var proxy;
        var expected;

        before( (done) => {
            // Setup transparent proxy

            proxy = spyProxy.createProxy();

            // Get expected response from origin server
            makeRequest(mockServer, 'GET', '/index', (err, res) => {
                assert.ifError(err);
                expected = res.body.toString();
                done();
            });
        });

        it('returns requested resource unchanged', (done) => {
            request(proxy)
                .get('/index')
                .expect(200)
                .expect(new RegExp(expected), done);
        });

        after( () =>{
            proxy.close(); 
        });
    });

    /*========================================================*/
    describe(' - Custom proxy response', () => {
        var proxy;

        before( () => {
            // Setup proxy
            var customResponseStrategy = require('../strategies/customResponse');
            customResponseStrategy = customResponseStrategy({
                'text/html': 'fixtures/fixture.html',
            });
            proxy = spyProxy.createProxy(customResponseStrategy);
            //equivalent to proxy.changeDefaultMode(customResponseStrategy);
        });

        it('returns custom response if it has been configured', (done) =>{
            var expected = fs.readFileSync('./fixtures/fixture.html', {encoding: 'utf-8'});
            request(proxy)
                .set('Accept', 'text/html')
                .get('/image.png')
                .expect('Content-type', 'text/html')
                .expect(200)
                .expect(new RegExp(expected), done);
        });

        it('returns resource from origin server if custom response is not present', (done) => {
            // Request image from origin server
            makeRequest(mockServer, 'GET', '/image.png', (err, res) => {
                assert.ifError(err);
                var expected = res.body;  // Buffer that holds binary image data

                // Request image from proxy server
                request(proxy)
                    .set('Accept', 'image/png')
                    .get('/image.png')
                    .expect('Content-type', 'image/png')
                    .expect(200)
                    .expect(expected, done);
            });
        });

        it('successfully changes the strategy configuration', (done) => {
            var expected = fs.readFileSync('fixtures/image.png');

            proxy.configure({
                'image/png': 'fixtures/image.png'
            });

            request(proxy)
                .set('Accept', 'image/png')
                .get('/image.png')
                .expect('Content-type', 'image/png')
                .expect(200)
                .expect(expected, done);
        });

        after( () =>{
            proxy.close(); 
        });

    });

    /*========================================================*/
    describe(' - Custom server request', () => {
        var proxy;

        before( () => {
            var customRequestStrategy = require('../strategies/customRequest');
            proxy = spyProxy.createProxy(customRequestStrategy());
        });

    });

    /*========================================================*/
    describe(' - Modify server response', () => {


    });
    
});
