var _ = require('lodash')
  , Promise = require('bluebird');

function queue(channelFactory) {

  var _queue = ''
    , _opts = {}
    , _exchange = {}
    , _prefetch;

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

  this.subscribe = function(handler) {
    return channelFactory().then(function(ch) {
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
              handler.call(msg, JSON.parse(msg.content.toString()), function() {
                ch.ack(msg);
              }, function() {
                ch.nack(msg);
              });
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
    return channelFactory().then(function(ch) {
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