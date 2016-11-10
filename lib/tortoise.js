var exchange = require('./exchange')
  , queue = require('./queue')
  , channelFactory = require('./channelFactory')
  , EventEmitter = require('events').EventEmitter;

function Tortoise(amqpHost, options) {

  EventEmitter.call(this);

  var chFactory = channelFactory.create(amqpHost, options);
  
  this.exchange = function(ex, type, opts) {
    return exchange.create(chFactory, this).configure(ex, type, opts);
  }

  this.queue = function(q, opts) {
    return queue.create(chFactory, this).configure(q, opts);
  }

  this.destroy = function() {
    return chFactory.closeAll();
  }

  return this;

}

Tortoise.ERRORS = require('./errors');

Tortoise.prototype.__proto__ = EventEmitter.prototype;

module.exports = Tortoise;