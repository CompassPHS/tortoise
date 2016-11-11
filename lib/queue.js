var _ = require('lodash')
  , Promise = require('bluebird')
  , failHandler = require('./failHandler')
  , util = require('util')
  , events = require('./events')
  , msgUtils = require('./utils/msgUtils');

function queue(channelFactory, tortoise) {

  var _queue = ''
    , _opts = {}
    , _bindings = []
    , _prefetch
    , _failOpts = { }
    , _dlx = { }
    , _json = false
    , _reestablish = false;

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

  var subscribe = function(handler) {
    var fHandler = failHandler.create(_failOpts);
    
    return setup().then(function(ch) {
      return new Promise(function(resolve, reject) {
        ch.consume(_queue, function(msg) {
          fHandler.invoke(function() {
            // Parse content
            var content = msg.content.toString();

            // nack (to dead) if json but not parseable
            if(_json) {
              try {
                content = JSON.parse(content);
              }
              catch(err) {
                ch.nack(msg, false, false);
                tortoise.emit(events.PARSEERROR, err, msg);
                return;
              }
            }
            handler.call(msg, content, function(allUpTo) {
              fHandler.success();
              ch.ack(msg, allUpTo);
            }, function(requeue, allUpTo) {
              fHandler.failed(msg);
              ch.nack(msg, allUpTo, requeue);
            });
          });
        })
        .then(function() {
          if(_reestablish) {
            ch.on('close', function() {
              subscribe(handler);
            });
          }
          resolve(ch);
        });
      });
    });
  }

  this.subscribe = subscribe;

  this.publish = function(msg, opts) {
    opts = opts || {};
    
    return msgUtils.validateAndParsePublish(msg).then(function(parsedMessage) {
      return channelFactory.get().then(function(ch) {
        return ch.assertQueue(_queue, _opts).then(function() {
          ch.sendToQueue(_queue, new Buffer(parsedMessage), opts);
          return ch.close();
        });
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

  this.json = function() {
    _json = true;
    return this;
  }

  this.reestablish = function() {
    _reestablish = true;
    return this;
  }

  return this;
}

module.exports = {
  create: queue
}