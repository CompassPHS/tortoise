var _ = require('lodash')
  , Promise = require('bluebird')
  , moment = require('moment');

function queue(channelFactory) {

  var _queue = ''
    , _opts = {}
    , _exchange = {}
    , _prefetch
    , _failThreshold // Default behavior, no threshold
    , _failTimeout = 1000 * 60 // 1 minute
    , _retryTimeout = 1000 * 5; // 5 seconds

  var failCount = 0;
  var lastFail;

  var setFail = function(fails) {
    failCount = fails;
  }

  var resetFail = function() {
    // If we have surpassed our timeout, reset fail count
    if((lastFail && moment(lastFail).add(_failTimeout, 'milliseconds') < moment())) {
      failCount = 0;
    }
  }

  var retryTimeout = function() {
    resetFail();
    if(!_failThreshold || failCount < _failThreshold) {
      return 0;
    } else {
      return _retryTimeout;
    }
  }

  var messageFailed = function(msg) {
    resetFail();
    lastFail = moment().format();
    failCount++;
  }

  this.configure = function(queue, opts) {
    _queue = queue || '';
    _opts = opts || {};
    return this;
  }

  this.exchange = function(exchange, type, routingKey, opts) {
    _exchange.name = exchange;
    _exchange.type = type;
    _exchange.routingKey = routingKey;
    _exchange.opts = opts || {};
    return this;
  }

  this.prefetch = function(prefetch) {
    _prefetch = prefetch;
    return this;
  }

  this.failThreshold = function(failThreshold) {
    _failThreshold = failThreshold;
    return this;
  }

  this.failTimeout = function(failTimeout) {
    _failTimeout = failTimeout;
    return this;
  }

  this.retryTimeout = function(retryTimeout) {
    _retryTimeout = retryTimeout;
    return this;
  }

  this.subscribe = function(handler) {
    return channelFactory.get().then(function(ch) {
      return new Promise(function(f, r) { 
        if(_prefetch) {
          ch.prefetch(_prefetch).then(f, r);
        } else {
          f();
        }
      }).then(function() {
        return ch.assertQueue(_queue, _opts).then(function() {

          var beginConsumption = function() {
            return ch.consume(_queue, function(msg) {
              var timeout = retryTimeout();
              console.log('waiting ' + timeout + 'ms');
              setTimeout(function() {
                handler.call(msg, JSON.parse(msg.content.toString()), function(allUpTo) {
                  setFail(0);
                  ch.ack(msg, allUpTo);
                }, function(allUpTo, requeue) {
                  messageFailed(msg);
                  ch.nack(msg, allUpTo, requeue);
                });
              }, retryTimeout());
            });
          }

          if(!_.isEmpty(_exchange)) {
            return ch.assertExchange(_exchange.name, _exchange.type, _exchange.opts).then(function() {
              return ch.bindQueue(_queue, _exchange.name, _exchange.routingKey).then(function() {
                return beginConsumption();
              });
            });
          } else {
            return beginConsumption();
          }

        });
      });
    });
  }

  this.publish = function(msg, opts) {
    opts = opts || {};
    return channelFactory.get().then(function(ch) {
      return ch.assertQueue(_queue, _opts).then(function() {
        ch.sendToQueue(_queue, new Buffer(JSON.stringify(msg)), opts);
        return ch.close();
      });
    });
  }

  return this;
}

module.exports = {
  create: queue
}