var Promise = require('bluebird')
  , msgUtils = require('./utils/msgUtils');

function exchange(channelFactory, tortoise) {

  var _exchange = ''
    , _type = ''
    , _opts = {};

  this.configure = function(exchange, type, opts) {
    _exchange = exchange || '';
    _type = type || '';
    _opts = opts || {};
    return this;
  }

  var setup = function() {
    return new Promise(function(resolve, reject) {
      return channelFactory.get().then(function(ch) {
        return ch.assertExchange(_exchange, _type, _opts).then(function() {
          resolve(ch);
        });
      });
    });
  }

  this.publish = function(routingKey, msg, opts) {
    opts = opts || {};
    return setup().then(function(ch) {
      return msgUtils.validateAndParsePublish(msg).then(function(parsedMessage) {
        ch.publish(_exchange, routingKey, new Buffer(parsedMessage), opts);
        return ch.close();
      });
    });
  }

  this.setup = function() {
    return setup().then(function(ch) {
      return ch.close();
    });
  }

  return this;
}

module.exports = {
  create: exchange
}