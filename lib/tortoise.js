var exchange = require('./exchange')
  , queue = require('./queue')
  , channelFactory = require('./channelFactory');

function Tortoise(amqpHost, options) {

  var chFactory = channelFactory.create(amqpHost, options);
  
  this.exchange = function(ex, type, opts) {
    return exchange.create(chFactory).configure(ex, type, opts);
  }

  this.queue = function(q, opts) {
    return queue.create(chFactory).configure(q, opts);
  }

  this.destroy = function() {
    return chFactory.closeAll();
  }

  return this;

}

module.exports = Tortoise;