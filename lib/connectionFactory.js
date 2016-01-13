var amqp = require('amqplib')
  , _ = require('lodash')
  , Promise = require('bluebird');

function connectionFactory(amqpHost, options) {

  _.defaults(options, {
    connectRetries: 0,
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
            });
            return conn;
          })
          .catch(function(err) {
            if(err.code === 'ECONNREFUSED' && (++connectAttempts <= options.connectRetries || options.connectRetries === -1)) {
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