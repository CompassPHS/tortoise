var assert = require('chai').assert
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , queue = require('../lib/queue')
  , events = require('../lib/events');

var fn = function() { };
var p = function(v) {
  return new Promise(function(f) { f(v); });
}

function build() {

  var ch = { prefetch: fn, nack: fn, ack: fn, bindQueue: fn, consume: fn,assertQueue: fn, assertExchange: fn, publish: fn, close: fn, sendToQueue: fn, on: fn };
  var chFactory = { get: fn }
  
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
  var onStub = sinon.stub(ch, 'on').returns(p());
  var getStub = sinon.stub(chFactory, 'get').returns(p(ch));

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
      bindQueue: bindQueueStub,
      on: onStub
    },
    chFactory: {
      get: getStub
    }
  }
}

suite('queue', function() {

  test('publish publishes message to provided queue', function(done) {
    var stubs = build();

    var ex = queue.create(stubs.chFactory)
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

    var ex = queue.create(stubs.chFactory)
      .publish({})
      .then(function() {
        assert(stubs.ch.close.calledOnce)
        done();
      });
  });

  test('publish publishes with options', function(done) {
    var stubs = build();

    var opts = { persistent: true };

    var ex = queue.create(stubs.chFactory)
      .publish({}, opts)
      .then(function() {
        assert.equal(stubs.ch.sendToQueue.args[0][2], opts)
        done();
      });
  });

  test('configure sets options', function(done) {
    var stubs = build();

    var opts = {};

    queue.create(stubs.chFactory)
      .configure('myQueue', opts)
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', opts));
        done()
      });
  });

  test('default options are set', function(done) {
    var stubs = build();

    queue.create(stubs.chFactory)
      .publish({})
      .then(function() {
        assert(stubs.ch.assertQueue.calledWithExactly('', {}));
        done()
      });
  });

  test('dead letter configure with no options configures dead letter queue', function(done) {
    var stubs = build();

    var queueOpts = {
      arguments: {
        'x-dead-letter-exchange': 'dead.exchange'
      }
    };

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(stubs.chFactory)
      .configure('myQueue')
      .dead('dead.exchange', 'dead.queue')
      .subscribe(function(msg, ack) {
        ack();
      }).then(function() {
        // Verify setup
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', queueOpts));
        assert(stubs.ch.assertQueue.calledWithExactly('dead.queue', {}));
        assert(stubs.ch.assertExchange.calledWithExactly('dead.exchange', 'topic', {}));
        done();
      });
  })

  test('dead letter configure with options configures dead letter queue', function(done) {
    var stubs = build();

    var queueOpts = {
      arguments: {
        'x-dead-letter-exchange': 'dead.exchange'
      }
    };
    var bindingOpts = {testA:'testA'};
    var exchangeQueueOpts = {testB:'testB'}

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(stubs.chFactory)
      .configure('myQueue')
      .dead('dead.exchange', bindingOpts, 'dead.queue', exchangeQueueOpts)
      .subscribe(function(msg, ack) {
        ack();
      }).then(function() {
        // Verify setup
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', queueOpts));
        assert(stubs.ch.assertQueue.calledWithExactly('dead.queue', exchangeQueueOpts));
        assert(stubs.ch.assertExchange.calledWithExactly('dead.exchange', 'topic', bindingOpts));
        assert(stubs.ch.bindQueue.calledWithExactly('dead.queue', 'dead.exchange', '#'));
        done();
      });
  })

  test('dead letter configure will configure with no bindingOpts', function(done) {
    var stubs = build();

    var queueOpts = {
      arguments: {
        'x-dead-letter-exchange': 'dead.exchange'
      }
    };
    var bindingOpts = {testA:'testA'};
    var exchangeQueueOpts = {testB:'testB'}

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(stubs.chFactory)
      .configure('myQueue')
      .dead('dead.exchange', 'dead.queue', exchangeQueueOpts)
      .subscribe(function(msg, ack) {
        ack();
      }).then(function() {
        // Verify setup
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', queueOpts));
        assert(stubs.ch.assertQueue.calledWithExactly('dead.queue', exchangeQueueOpts));
        assert(stubs.ch.assertExchange.calledWithExactly('dead.exchange', 'topic', {}));
        assert(stubs.ch.bindQueue.calledWithExactly('dead.queue', 'dead.exchange', '#'));
        done();
      });
  })

  test('dead letter with exchange only does not bind to queue', function(done) {
    var stubs = build();

    var queueOpts = {
      arguments: {
        'x-dead-letter-exchange': 'dead.exchange'
      }
    };

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(stubs.chFactory)
      .configure('myQueue')
      .dead('dead.exchange')
      .subscribe(function(msg, ack) {
        ack();
      }).then(function() {
        // Verify setup
        assert(stubs.ch.assertQueue.calledWithExactly('myQueue', queueOpts));
        assert(stubs.ch.assertQueue.calledOnce);
        assert(stubs.ch.assertExchange.calledWithExactly('dead.exchange', 'topic', {}));
        assert(stubs.ch.bindQueue.callCount === 0);
        done();
      });
  })

  test('subscribe to queue calls handler on message received', function(done) {
    var stubs = build();

    queue.create(stubs.chFactory)
      .json()
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

    queue.create(stubs.chFactory)
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

    queue.create(stubs.chFactory)
      .subscribe(function(msg, ack) {
        ack();

        // Verify ack was called
        assert(stubs.ch.ack.calledOnce);
        assert.equal(stubs.ch.ack.args[0][0], message);
        assert.equal(stubs.ch.ack.args[0][1], undefined);
        assert.equal(stubs.ch.nack.callCount, 0);

        done();
      }).then(function() {
        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(message);
      });
  });

  test('subscribe and ack with params acks message', function(done) {
    var stubs = build();

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};

    queue.create(stubs.chFactory)
      .subscribe(function(msg, ack) {
        ack(true);

        // Verify ack was called
        assert(stubs.ch.ack.calledOnce);
        assert.equal(stubs.ch.ack.args[0][0], message);
        assert.equal(stubs.ch.ack.args[0][1], true);
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
    
    queue.create(stubs.chFactory)
      .subscribe(function(msg, ack, nack) {
        nack();
        
        // Verify nack was called
        assert(stubs.ch.nack.calledOnce);
        assert.equal(stubs.ch.nack.args[0][0], message);
        assert.equal(stubs.ch.nack.args[0][1], undefined);
        assert.equal(stubs.ch.nack.args[0][2], undefined);
        assert.equal(stubs.ch.ack.callCount, 0);

        done();
      }).then(function() {
        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(message);
      });
  });

  test('subscribe and nack with params nacks message', function(done) {
    var stubs = build();

    var message = {content:new Buffer(JSON.stringify({Hello:'World'}))};
    
    queue.create(stubs.chFactory)
      .subscribe(function(msg, ack, nack) {
        nack(false);
        
        // Verify nack was called
        assert(stubs.ch.nack.calledOnce);
        assert.equal(stubs.ch.nack.args[0][0], message);
        assert.equal(stubs.ch.nack.args[0][2], false);
        assert.equal(stubs.ch.nack.args[0][1], undefined);
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

    queue.create(stubs.chFactory)
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

    queue.create(stubs.chFactory)
      .subscribe(fn)
      .then(function() {
        assert.equal(stubs.ch.prefetch.callCount, 0);
        done();
      });
  });

  test('subscribe with exchange binds to exchange', function(done) {
    var stubs = build();
    queue.create(stubs.chFactory)
      .configure('my-queue')
      .exchange('my-exchange', 'topic', 'routing.key', { durable: true })
      .exchange('my-other-exchange', 'topic', 'other.routing.key', { durable: true })
      .subscribe(fn)
      .then(function() {
        assert(stubs.ch.assertExchange.calledWith('my-exchange', 'topic', { durable: true }));
        assert(stubs.ch.assertExchange.calledWith('my-other-exchange', 'topic', { durable: true }));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-exchange', 'routing.key'));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-other-exchange', 'other.routing.key'));
        done();
      });
  });

  test('subscribe without exchange does not bind to exchange', function(done) {
    var stubs = build();
    queue.create(stubs.chFactory)
      .subscribe(fn)
      .then(function() {
        assert.equal(stubs.ch.assertExchange.callCount, 0);
        assert.equal(stubs.ch.bindQueue.callCount, 0);
        done();
      });
  });

  test('setup configures and closes channel', function(done) {
    var stubs = build();
    queue.create(stubs.chFactory)
      .configure('my-queue')
      .exchange('my-exchange', 'topic', 'routing.key', { durable: true })
      .setup()
      .then(function() {
        assert(stubs.ch.assertExchange.calledWith('my-exchange', 'topic', { durable: true }));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-exchange', 'routing.key'));
        assert(stubs.ch.close.calledOnce);
        assert(stubs.ch.consume.callCount === 0);
        done();
      });
  });

  test('subscribe with .json() will nack(requeue=false) and emit event when json is invalid', function(done) {
    var stubs = build();

    var message = {content:new Buffer('message')};

    var EventEmitter = require('events').EventEmitter;
    var eventEmitter = new EventEmitter();

    eventEmitter.on(events.PARSEERROR, function() {
      assert(stubs.ch.nack.calledOnce);
      assert.equal(stubs.ch.nack.args[0][0], message);
      assert.equal(stubs.ch.nack.args[0][2], false);
      assert.equal(stubs.ch.nack.args[0][1], false);
      assert.equal(stubs.ch.ack.callCount, 0);
      done();
    });
    
    queue.create(stubs.chFactory, eventEmitter)
      .json()
      .subscribe(function(msg, ack, nack) {

      }).then(function() {
        // Call handler code
        var handler = stubs.ch.consume.args[0][1];
        handler(message);
      });
  });

  test('subscribe without reestablish will not listen for close event', function(done) {
        var stubs = build();

    queue.create(stubs.chFactory)
      .configure('my-queue')
      .exchange('my-exchange', 'topic', 'routing.key', { durable: true })
      .exchange('my-other-exchange', 'topic', 'other.routing.key', { durable: true })
      .subscribe(fn)
      .then(function() {
        assert(stubs.ch.assertExchange.calledWith('my-exchange', 'topic', { durable: true }));
        assert(stubs.ch.assertExchange.calledWith('my-other-exchange', 'topic', { durable: true }));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-exchange', 'routing.key'));
        assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-other-exchange', 'other.routing.key'));
        assert.equal(stubs.ch.on.callCount, 0);

        done();
      });
  });

  test('subscribe with restablish will listen for close event and reconfigure', function(done) {

    var stubs = build();

    queue.create(stubs.chFactory)
      .configure('my-queue')
      .reestablish()
      .exchange('my-exchange', 'topic', 'routing.key', { durable: true })
      .exchange('my-other-exchange', 'topic', 'other.routing.key', { durable: true })
      .subscribe(fn)
      .then(function() {

        var asserts = function(attempt) {
          assert(stubs.ch.assertExchange.calledWith('my-exchange', 'topic', { durable: true }));
          assert(stubs.ch.assertExchange.calledWith('my-other-exchange', 'topic', { durable: true }));
          assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-exchange', 'routing.key'));
          assert(stubs.ch.bindQueue.calledWith('my-queue', 'my-other-exchange', 'other.routing.key'));
          assert(stubs.ch.on.alwaysCalledWith('close'));

          assert.equal(stubs.ch.assertExchange.callCount, attempt * 2);
          assert.equal(stubs.ch.bindQueue.callCount, attempt * 2);
          assert.equal(stubs.ch.on.callCount, attempt);
        }

        asserts(1);

        var closeFn = stubs.ch.on.args[0][1];

        closeFn();

        Promise.delay(100).then(function() {
          asserts(2);
          done();
        });

      });

  });

});