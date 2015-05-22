var amqp = require('amqplib');

function channelFactory(amqpHost, options) {

  var connPromise = amqp.connect(amqpHost);

  this.get = function() {
    return connPromise.then(function(conn) {
      return conn.createChannel();
    });
  }

  this.closeAll = function() {
    return connPromise.then(function(conn) {
      return conn.close();
    });
  }

  return this;

}

module.exports = {
  create: channelFactory
}