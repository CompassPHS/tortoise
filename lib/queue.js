var _ = require('lodash')
  , Promise = require('bluebird')
  , failHandler = require('./failHandler')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

function queue(channelFactory) {

  var _queue = ''
    , _opts = {}
    , _bindings = []
    , _prefetch
    , _failOpts = { }
    , _dlx = { };

  failHandler.extend(_failOpts, this);

  var setup = function() {
    return new Promise(function(resolve, reject) {
      return channelFactory.get().then(function(ch) {
        return new Promise(function(f, r) { 
          if(_prefetch) {
            ch.prefetch(_prefetch).then(f, r);
          } else {
            f();
          }
        }).then(function() {
          var queueAsserts = [ch.assertQueue(_queue, _opts)];

          if(_dlx.queue) {
            queueAsserts.push(ch.assertQueue(_dlx.queue, _dlx.queueOpts));
          }

          return Promise.all(queueAsserts).then(function() {

            var bindingPromises = [];

            if(_dlx.exchange) {
              var p = ch.assertExchange(_dlx.exchange, 'topic', _dlx.bindingOpts);
              if(_dlx.queue) {
                bindingPromises.push(p.then(function() {
                  return ch.bindQueue(_dlx.queue, _dlx.exchange, '#');
                }));
              } else {
                bindingPromises.push(p);
              }
            }

            if(!_.isEmpty(_bindings)) {
              _.each(_bindings, function(binding) {
                bindingPromises.push(ch.assertExchange(binding.name, binding.type, binding.opts).then(function() {
                  return ch.bindQueue(_queue, binding.name, binding.routingKey);
                }));
              });

              return Promise.all(bindingPromises).then(function() {
                resolve(ch);
              });
            } else {
              resolve(ch);
            }
          });
        });
      });
    });
  }

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
    
    return setup().then(function(ch) {
      return new Promise(function(resolve, reject) {
        ch.consume(_queue, function(msg) {
          fHandler.invoke(function() {
            handler.call(msg, JSON.parse(msg.content.toString()), function(allUpTo) {
              fHandler.success();
              ch.ack(msg, allUpTo);
            }, function(requeue, allUpTo) {
              fHandler.failed(msg);
              ch.nack(msg, allUpTo, requeue);
            });
          });
        })
        .then(function() {
          resolve(ch);
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

  this.dead = function(exchange, bindingOpts, queue, queueOpts) {

    if(typeof queue === 'object') {
      queueOpts = queue;
    }
    
    if(typeof bindingOpts === 'string') {
      queue = bindingOpts;
      bindingOpts = { };
    }

    _dlx.exchange = exchange;
    _dlx.queue = queue;
    _dlx.queueOpts = queueOpts || { };
    _dlx.bindingOpts = bindingOpts || { };

    // Change queue arguments
    _opts.arguments = _opts.arguments || { };
    _opts.arguments['x-dead-letter-exchange'] = exchange;

    return this;
  }

  this.setup = function() {
    return setup().then(function(ch) {
      return ch.close();
    });
  }

  return this;
}

util.inherits(queue, EventEmitter);

module.exports = {
  create: queue
}