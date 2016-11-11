var exchange = require('./exchange')
  , queue = require('./queue')
  , channelFactory = require('./channelFactory')
  , EventEmitter = require('events').EventEmitter;

function Tortoise(amqpHost, options) {

  EventEmitter.call(this);

  var chFactory = channelFactory.create(amqpHost, options, this);
  
  this.exchange = function(ex, type, opts) {
    return exchange.create(chFactory, this).configure(ex, type, opts);
  }

  this.queue = function(q, opts) {
    return queue.create(chFactory, this).configure(q, opts);
  }

  this.destroy = function() {
    return chFactory.close();
  }

  return this;

}

Tortoise.EVENTS = require('./events');

Tortoise.prototype.__proto__ = EventEmitter.prototype;

module.exports = Tortoise;