var assert = require('chai').assert
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , queue = require('../lib/queue');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

function build() {

  var ch = { prefetch: fn, nack: fn, ack: fn, bindQueue: fn, consume: fn,assertQueue: fn, assertExchange: fn, publish: fn, close: fn, sendToQueue: fn };

  // Default stubbing behavior
  var assertExchangeStub = sinon.stub(ch, 'assertExchange').returns(p());
  var assertQueueStub = sinon.stub(ch, 'assertQueue').returns(p());
  var sendToQueueStub = sinon.stub(ch, 'sendToQueue');
  var closeStub = sinon.stub(ch, 'close').returns(p());
  var consumeStub = sinon.stub(ch, 'consume').returns(p());
  var bindQueueStub = sinon.stub(ch, 'bindQueue').returns(p());
  var ackStub = sinon.stub(ch, 'ack');
  var nackStub = sinon.stub(ch, 'nack');
  var prefetchStub = sinon.stub(ch, 'prefetch').returns(p());

  return {
    ch: {
      assertExchange: assertExchangeStub,
      sendToQueue: sendToQueueStub,
      close: closeStub,
      assertQueue: assertQueueStub,
      consume: consumeStub,
      ack: ackStub,
      nack: nackStub,
      prefetch: prefetchStub,
      bindQueue: bindQueueStub
    }
  }
}

suite('Queue', function() {

  test('publish publishes message to provided queue', function(done) {
    var stubs = build();

    var ex = queue.create(sinon.stub().returns(p(stubs.ch)))
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

    var ex = queue.create(sinon.stub().returns(p(stubs.ch)))
      .publish({})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('publish publishes with options', function(done) {
    var stubs = build();

    var opts = { persistent: true };

    var ex = queue.create(sinon.stub().returns(p(stubs.ch)))
      .publish({}, opts)
      .then(function() {
        assert.equal(stubs.ch.sendToQueue.args[0][2], opts)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    queue.create(sinon.stub().returns(p(stubs.ch)))
      .configure('myQueue', opts)
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    queue.create(sinon.stub().returns(p(stubs.ch)))
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('', {}));
        done()
      });
  });

  test('subscribe to queue calls handler on message received', function(done) {
    var stubs = build();

    queue.create(sinon.stub().returns(p(stubs.ch)))
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

    queue.create(sinon.stub().returns(p(stubs.ch)))
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

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(sinon.stub().returns(p(stubs.ch)))
      .subscribe(function(msg, ack) {
        ack();

        // Verify ack was called
        assert(stubs.ch.ack.calledOnce);
        assert.equal(stubs.ch.ack.args[0][0], message);
        assert.equal(stubs.ch.nack.callCount, 0);

        done();
      }).then(function() {
        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(message);
      });
  });

  test('subscribe and nack nacks message', function(done) {
    var stubs = build();

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};
    
    queue.create(sinon.stub().returns(p(stubs.ch)))
      .subscribe(function(msg, ack, nack) {
        nack();
        
        // Verify nack was called
        assert(stubs.ch.nack.calledOnce);
        assert.equal(stubs.ch.nack.args[0][0], message);
        assert.equal(stubs.ch.ack.callCount, 0);

        done();
      }).then(function() {
        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(message);
      });
  });

  test('subscribe sets prefetch when set', function(done) {
    var stubs = build();

    queue.create(sinon.stub().returns(p(stubs.ch)))
      .prefetch(1)
      .subscribe(fn)
      .then(function() {
        var prefetch = stubs.ch.prefetch.args[0][0];
        assert(stubs.ch.prefetch.calledOnce);
        assert.equal(prefetch, 1);
        done();
      });
  });

  test('subscribe ignores prefetch when not set', function(done) {
    var stubs = build();

    queue.create(sinon.stub().returns(p(stubs.ch)))
      .subscribe(fn)
      .then(function() {
        assert.equal(stubs.ch.prefetch.callCount, 0);
        done();
      });
  });

  test('subscribe with exchange binds to exchange', function(done) {
    var stubs = build();
    queue.create(sinon.stub().returns(p(stubs.ch)))
      .configure('my-queue')
      .exchange('my-exchange', 'topic', 'routing.key', { durable: true })
      .subscribe(fn)
      .then(function() {
        assert(stubs.ch.assertExchange.calledWith('my-exchange', 'topic', { durable: true }));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-exchange', 'routing.key'));
        done();
      });
  });

  test('subscribe without exchange does not bind to exchange', function(done) {
    var stubs = build();
    queue.create(sinon.stub().returns(p(stubs.ch)))
      .subscribe(fn)
      .then(function() {
        assert.equal(stubs.ch.assertExchange.callCount, 0);
        assert.equal(stubs.ch.bindQueue.callCount, 0);
        done();
      });
  });

});