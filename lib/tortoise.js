var amqp = require('amqplib')
  , exchange = require('./exchange')
  , queue = require('./queue');

function Tortoise(amqpHost) {

  var connPromise = amqp.connect(amqpHost);
  
  this.exchange = function(ex, type, opts) {
    return exchange.create(connPromise).configure(ex, type, opts);
  }

  this.queue = function(q, opts) {
    return queue.create(connPromise).configure(q, opts);
  }

  this.destroy = function() {
    return connPromise.then(function(conn) {
      return conn.close();
    });
  }

  return this;

}

module.exports = Tortoise;