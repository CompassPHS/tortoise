var connectionPool = require('./connectionPool')
  , _ = require('lodash');

function channelFactory(amqpHost, options) {

  var options = _.defaults(options || {}, {
    connectionPoolCount: 1
  });

  // Ensure that connection pool is at least 1 connection
  options.connectionPoolCount = options.connectionPoolCount >= 1 
    ? options.connectionPoolCount 
    : 1;

  var connPool = connectionPool.create(amqpHost, options.connectionPoolCount);

  this.get = function() {
    return connPool.getNext().then(function(conn) {
      return conn.createChannel();
    });
  }

  this.closeAll = function() {
    return Promise.all(connPool.getAll()).then(function(conns) {
      return Promise.all(_.map(conns, function(conn) {
        return conn.close(); 
      }));
    });
  }

  return this;

}

module.exports = {
  create: channelFactory
}