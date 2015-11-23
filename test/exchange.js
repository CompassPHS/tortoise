var assert = require('chai').assert
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , exchange = require('../lib/exchange');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

function build() {

  var ch = { assertExchange: fn, publish: fn, close: fn };
  var chFactory = { get: fn }

  // Default stubbing behavior
  var assertExchangeStub = sinon.stub(ch, 'assertExchange').returns(p());
  var publishStub = sinon.stub(ch, 'publish');
  var closeStub = sinon.stub(ch, 'close').returns(p());
  var getStub = sinon.stub(chFactory, 'get').returns(p(ch));

  return {
    ch: {
      assertExchange: assertExchangeStub,
      publish: publishStub,
      close: closeStub
    },
    chFactory: {
      get: getStub
    }
  }
}

suite('exchange', function() {

  test('publish publishes message to provided exchange', function(done) {
    var stubs = build();

    var ex = exchange.create(stubs.chFactory)
      .configure('myExchange', 'direct', {})
      .publish('rk', {Hello:'World'})
      .then(function() {
        assert(stubs.ch.publish.calledWith('myExchange', 'rk'))
        
        var msg = JSON.parse(stubs.ch.publish.args[0][2].toString());
        assert.equal(msg.Hello, 'World');

        done();
      });

  });

  test('publish closes channel', function(done) {
    var stubs = build();

    var ex = exchange.create(stubs.chFactory)
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('publish publishes with options', function(done) {
    var stubs = build();

    var opts = { persistent: true };

    var ex = exchange.create(stubs.chFactory)
      .publish('rk', {}, opts)
      .then(function() {
        assert.equal(stubs.ch.publish.args[0][3], opts)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    exchange.create(stubs.chFactory)
      .configure('myExchange', 'direct', opts)
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.assertExchange.calledWithExactly('myExchange', 'direct', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    exchange.create(stubs.chFactory)
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.assertExchange.calledWithExactly('', '', {}));
        done()
      });
  });

  test('setup configures and closes channel', function(done) {
    var stubs = build();

    var ex = exchange.create(stubs.chFactory)
      .configure('myExchange', 'direct', {})
      .setup()
      .then(function() {
        assert(stubs.ch.assertExchange.calledWithExactly('myExchange', 'direct', {}));
        assert(stubs.ch.close.calledOnce);
        done();
      });

  });

});