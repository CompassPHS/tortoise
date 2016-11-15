var amqp = require('amqplib')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , events = require('./events');

function connectionFactory(amqpHost, options, tortoise) {

  options = _.defaults(options, {
    connectRetries: -1,
    connectRetryInterval: 1000
  });

  var connection = null;

  this.get = function() {
    // The Promise.resolve() here forces execution on the next
    // event loop, allowing for a potentially closed connection
    // to be evaluated, and a new one to be constructed
    return Promise.resolve().then(function() {

      if(connection) {
        return Promise.resolve(connection);
      }

      var connectAttempts = 1;

      var connect = function() {
        return amqp.connect(amqpHost)
          .then(function(conn) {
            connection = conn;
            conn.on('close', function() {
              connection = null;
              tortoise.emit(events.CONNECTIONCLOSED);
            });
            conn.on('error', function(err) {
              if(err.code === 'ECONNRESET') {
                tortoise.emit(events.CONNECTIONDISCONNECTED, err);
              } else {
                tortoise.emit(events.CONNECTIONERROR, err);
              }
            });
            return conn;
          })
          .catch(function(err) {
            tortoise.emit(events.CONNECTIONERROR, err);
            if(++connectAttempts <= options.connectRetries || options.connectRetries === -1) {
              return Promise.delay(options.connectRetryInterval).then(function() {
                return connect();
              });
            } else {
              throw err;
            }
          });
      }

      return connect();
    });
  }

  return this;

}

module.exports = {
  create: connectionFactory
}