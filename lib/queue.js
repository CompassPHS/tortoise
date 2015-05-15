var _ = require('lodash');

function Queue(connPromise) {

  var _queue = ''
    , _opts = {}
    , _exchange = {};

  this.configure = function(queue, opts) {
    _queue = queue || '';
    _opts = opts || {};
    return this;
  }

  this.exchange = function(exchange, type, routingKey, opts) {
    _exchange.name = exchange;
    _exchange.type = type;
    _exchange.routingKey = routingKey;
    _exchange.opts = opts || {};
    return this;
  }

  this.subscribe = function(handler) {
    connPromise.then(function(conn) {
      conn.createChannel().then(function(ch) {
        ch.assertQueue(_queue, _opts).then(function() {

          var beginConsumption = function() {
            ch.consume(_queue, function(msg) {
              handler(JSON.parse(msg.content.toString()), function() {
                ch.ack(msg);
              });
            });
          }

          if(!_.isEmpty(_exchange)) {
            ch.assertExchange(_exchange.name, _exchange.type, _exchange.opts).then(function() {
              ch.bindQueue(_queue, _exchange.name, _exchange.routingKey).then(function() {
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
        return ch.assertQueue(_queue, _opts).then(function() {
          ch.sendToQueue(_queue, new Buffer(JSON.stringify(msg)));
          return ch.close();
        });
      });
    });
  }

  return this;
}

module.exports = Queue;