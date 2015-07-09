var _ = require('lodash')
  , Promise = require('bluebird')
  , failHandler = require('./failHandler');

function queue(channelFactory) {

  var _queue = ''
    , _opts = {}
    , _bindings = []
    , _prefetch
    , _failOpts = { };

  failHandler.extend(_failOpts, this);

  this.configure = function(queue, opts) {
    _queue = queue || '';
    _opts = opts || {};
    return this;
  }

  this.exchange = function(exchange, type, routingKey, opts) {
    _bindings.push({
      name: exchange,
      type: type,
      routingKey: routingKey,
      opts: opts
    })
    return this;
  }

  this.prefetch = function(prefetch) {
    _prefetch = prefetch;
    return this;
  }

  this.subscribe = function(handler) {
    var fHandler = failHandler.create(_failOpts);

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
              fHandler.invoke(function() {
                handler.call(msg, JSON.parse(msg.content.toString()), function(allUpTo) {
                  fHandler.success();
                  ch.ack(msg, allUpTo);
                }, function(allUpTo, requeue) {
                  fHandler.failed(msg);
                  ch.nack(msg, allUpTo, requeue);
                });
              });
            });
          }

          if(!_.isEmpty(_bindings)) {
            var bindingPromises = _.map(_bindings, function(binding) {
              return ch.assertExchange(binding.name, binding.type, binding.opts).then(function() {
                return ch.bindQueue(_queue, binding.name, binding.routingKey);
              });
            });
            return Promise.all(bindingPromises).then(function() {
              return beginConsumption();
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