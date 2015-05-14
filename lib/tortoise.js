var amqp = require('amqplib')
  , _ = require('lodash');

function Tortoise(amqpHost) {

  var connPromise = amqp.connect(amqpHost);
  
  this.exchange = function Exchange(exchange, type, opts) {
    opts = opts || {};

    this.publish = function(routingKey, msg) {
      return connPromise.then(function(conn) {
        return conn.createChannel().then(function(ch) {
          return ch.assertExchange(exchange, type, opts).then(function() {
            ch.publish(exchange, routingKey, new Buffer(JSON.stringify(msg)));
            return ch.close();
          });
        });
      });
    }

    return this;

  }

  this.queue = function Queue(queue, opts) {
    opts = opts || {};

    var exchange = {};

    this.exchange = function(exchange, type, routingKey, opts) {
      exchange.name = exchange;
      exchange.type = type;
      exchange.routingKey = routingKey;
      exchange.opts = opts || {};

      return this;
    }

    this.subscribe = function(handler) {
      connPromise.then(function(conn) {
        conn.createChannel().then(function(ch) {
          ch.assertQueue(queue, opts).then(function() {

            var beginConsumption = function() {
              ch.consume(queue, function(msg) {
                handler(JSON.parse(msg.content.toString()), function() {
                  ch.ack(msg);
                });
              });
            }

            if(!_.isEmpty(exchange)) {
              ch.assertExchange(exchange.name, exchange.type, exchange.opts).then(function() {
                ch.bindQueue(queue, exchange.name, exchange.routingKey).then(function() {
                  beginConsumption();
                });
              });
            } else {
              beginConsumption();
            }

          });
        });
      });
    }

    this.publish = function(msg) {
      return connPromise.then(function(conn) {
        return conn.createChannel().then(function(ch) {
          return ch.assertQueue(queue, opts).then(function() {
            ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)));
            return ch.close();
          });
        });
      });
    }

    return this;
  }

  this.destroy = function() {
    connPromise.then(function(conn) {
      conn.close();
    });
  }

  return this;

}

module.exports = Tortoise;