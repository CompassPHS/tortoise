var connectionFactory = require('./connectionFactory')
  , Promise = require('bluebird')
  , _ = require('lodash');

function channelFactory(amqpHost, options, tortoise) {

  var connFactory = connectionFactory.create(amqpHost, options, tortoise);

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