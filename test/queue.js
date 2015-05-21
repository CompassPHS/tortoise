var assert = require('assert')
  , sinon = require('sinon')
  , async = require('async')
  , Promise = require('bluebird');

var Queue = require('../lib/queue');

var emptyFn = function() { };
var quickPromise = function(returnValue) {
  return new Promise(function(f) { f(returnValue); });
}

function build() {

  var ch = { nack: emptyFn, ack: emptyFn, bindQueue: emptyFn, consume: emptyFn,assertQueue: emptyFn, assertExchange: emptyFn, publish: emptyFn, close: emptyFn, sendToQueue: emptyFn };
  var conn = { createChannel: emptyFn };

  // Default stubbing behavior
  var createChannelStub = sinon.stub(conn, 'createChannel').returns(quickPromise(ch));
  var assertExchangeStub = sinon.stub(ch, 'assertExchange').returns(quickPromise());
  var assertQueueStub = sinon.stub(ch, 'assertQueue').returns(quickPromise());
  var sendToQueueStub = sinon.stub(ch, 'sendToQueue');
  var closeStub = sinon.stub(ch, 'close').returns(quickPromise());
  var consumeStub = sinon.stub(ch, 'consume').returns(quickPromise());
  var bindQueueStub = sinon.stub(ch, 'bindQueue').returns(quickPromise());
  var ackStub = sinon.stub(ch, 'ack');
  var nackStub = sinon.stub(ch, 'nack');

  return {
    conn: {
      createChannel: createChannelStub
    },
    ch: {
      assertExchange: assertExchangeStub,
      sendToQueue: sendToQueueStub,
      close: closeStub,
      assertQueue: assertQueueStub,
      consume: consumeStub,
      ack: ackStub,
      nack: nackStub
    }
  }
}

suite('Queue', function() {

  test('publish publishes message to provided queue', function(done) {
    var stubs = build();

    var ex = new Queue(quickPromise(stubs.conn))
      .configure('myQueue', {})
      .publish({Hello:'World'})
      .then(function() {
        assert(stubs.ch.sendToQueue.calledWith('myQueue'))
        
        var msg = JSON.parse(stubs.ch.sendToQueue.args[0][1].toString());
        assert.equal(msg.Hello, 'World');

        done();
      });

  });

  test('publish closes channel', function(done) {
    var stubs = build();

    var ex = new Queue(quickPromise(stubs.conn))
      .publish({})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('publish publishes with options', function(done) {
    var stubs = build();

    var opts = { persistent: true };

    var ex = new Queue(quickPromise(stubs.conn))
      .publish({}, opts)
      .then(function() {
        assert.equal(stubs.ch.sendToQueue.args[0][2], opts)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    new Queue(quickPromise(stubs.conn))
      .configure('myQueue', opts)
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('', {}));
        done()
      });
  });

  test('subscribe to queue calls handler on message received', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .subscribe(function(msg) {
        assert.equal(msg.Hello, 'World');
        done();
      }).then(function() {
        var handler = stubs.ch.consume.args[0][1];
        handler({content:new Buffer(JSON.stringify({Hello:'World'}))});
      });
  });

  test('subscribe sets msg data to scope', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .subscribe(function(msg) {
        assert.equal(this.field, 'test');
        done();
      }).then(function() {
        var handler = stubs.ch.consume.args[0][1];
        handler({field:'test', content:new Buffer(JSON.stringify({Hello:'World'}))});
      });
  });

  test('subscribe and ack acks message', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .subscribe(function(msg, ack) {
        ack();
        done();
      }).then(function() {
        var msg = {content:new Buffer(JSON.stringify({Hello:'World'}))};

        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(msg);

        // Verify ack was called
        assert(stubs.ch.ack.calledOnce);
        assert.equal(stubs.ch.ack.args[0][0], msg);
        assert.equal(stubs.ch.nack.callCount, 0);
      });
  });

  test('subscribe and nack nacks message', function(done) {
    var stubs = build();

    new Queue(quickPromise(stubs.conn))
      .subscribe(function(msg, ack, nack) {
        nack();
        done();
      }).then(function() {
        var msg = {content:new Buffer(JSON.stringify({Hello:'World'}))};

        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(msg);

        // Verify ack was called
        assert(stubs.ch.nack.calledOnce);
        assert.equal(stubs.ch.nack.args[0][0], msg);
        assert.equal(stubs.ch.ack.callCount, 0);
      });
  });

  test('subscribe with exchange binds to exchange', function() {

  });

  test('subscribe without exchange does not bind to exchange', function() {

  });

});