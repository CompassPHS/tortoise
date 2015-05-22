var assert = require('chai').assert
  , sinon = require('sinon')
  , async = require('async')
  , Promise = require('bluebird');

var Exchange = require('../lib/exchange');

var emptyFn = function() { };
var quickPromise = function(returnValue) {
  return new Promise(function(f) { f(returnValue); });
}

function build() {

  var ch = { assertExchange: emptyFn, publish: emptyFn, close: emptyFn };
  var conn = { createChannel: emptyFn };

  // Default stubbing behavior
  var createChannelStub = sinon.stub(conn, 'createChannel').returns(quickPromise(ch));
  var assertExchangeStub = sinon.stub(ch, 'assertExchange').returns(quickPromise());
  var publishStub = sinon.stub(ch, 'publish');
  var closeStub = sinon.stub(ch, 'close').returns(quickPromise());

  return {
    conn: {
      createChannel: createChannelStub
    },
    ch: {
      assertExchange: assertExchangeStub,
      publish: publishStub,
      close: closeStub
    }
  }
}

suite('Exchange', function() {

  test('publish publishes message to provided exchange', function(done) {
    var stubs = build();

    var ex = new Exchange(quickPromise(stubs.conn))
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

    var ex = new Exchange(quickPromise(stubs.conn))
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('publish publishes with options', function(done) {
    var stubs = build();

    var opts = { persistent: true };

    var ex = new Exchange(quickPromise(stubs.conn))
      .publish('rk', {}, opts)
      .then(function() {
        assert.equal(stubs.ch.publish.args[0][3], opts)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    new Exchange(quickPromise(stubs.conn))
      .configure('myExchange', 'direct', opts)
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.assertExchange.calledWithExactly('myExchange', 'direct', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    new Exchange(quickPromise(stubs.conn))
      .publish('rk', {})
      .then(function() {
        assert(stubs.ch.assertExchange.calledWithExactly('', '', {}));
        done()
      });
  });

});