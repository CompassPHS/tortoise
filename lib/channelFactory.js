var connectionFactory = require('./connectionFactory')
  , Promise = require('bluebird')
  , _ = require('lodash');

function channelFactory(amqpHost, options) {

  var options = _.defaults(options || {}, {
    connectionPoolCount: 1
  });

  // Ensure that connection pool is at least 1 connection
  options.connectionPoolCount = options.connectionPoolCount >= 1 
    ? options.connectionPoolCount 
    : 1;

  var connFactory = connectionFactory.create(amqpHost, options);

  this.get = function() {
    return connFactory.get().then(function(conn) {
      return conn.createChannel();
    });
  }

  this.close = function() {
    return connFactory.get().then(function(conn) {
      return conn.close();
    });
  }

  return this;

}

module.exports = {
  create: channelFactory
}