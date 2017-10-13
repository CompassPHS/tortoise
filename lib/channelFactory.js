var connectionFactory = require('./connectionFactory')
  , Promise = require('bluebird')
  , _ = require('lodash');

function channelFactory(amqpHost, options, tortoise) {

  var connFactory = connectionFactory.create(amqpHost, options, tortoise);

  var channel;

  this.get = function() {
    return connFactory.get().then(function(conn) {
      if (channel && options.keepChannelOpen) {
        return channel;
      }
      channel = conn.createChannel();
      if (options.keepChannelOpen) {
        channel.once('closing', function () {
          channel = null;
        });
      }
      return channel;
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