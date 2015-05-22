var amqp = require('amqplib')
  , exchange = require('./exchange')
  , queue = require('./queue');

function Tortoise(amqpHost) {

  var connPromise = amqp.connect(amqpHost);
  
  var channelFactory = function() {
    return connPromise.then(function(conn) {
      return conn.createChannel();
    });
  }
  
  this.exchange = function(ex, type, opts) {
    return exchange.create(channelFactory).configure(ex, type, opts);
  }

  this.queue = function(q, opts) {
    return queue.create(channelFactory).configure(q, opts);
  }

  this.destroy = function() {
    return connPromise.then(function(conn) {
      return conn.close();
    });
  }

  return this;

}

module.exports = Tortoise;