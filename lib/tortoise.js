var amqp = require('amqplib')
  , Exchange = require('./exchange')
  , Queue = require('./queue');

function Tortoise(amqpHost) {

  var connPromise = amqp.connect(amqpHost);
  
  this.exchange = function(exchange, type, opts) {
    return new Exchange(connPromise).configure(exchange, type, opts);
  }

  this.queue = function(queue, opts) {
    return new Queue(connPromise).configure(queue, opts);
  }

  this.destroy = function() {
    connPromise.then(function(conn) {
      conn.close();
    });
  }

  return this;

}

module.exports = Tortoise;