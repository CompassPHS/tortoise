function exchange(channelFactory) {

  var _exchange = ''
    , _type = ''
    , _opts = {};

  this.configure = function(exchange, type, opts) {
    _exchange = exchange || '';
    _type = type || '';
    _opts = opts || {};
    return this;
  }

  this.publish = function(routingKey, msg, opts) {
    opts = opts || {};
    return channelFactory.get().then(function(ch) {
      return ch.assertExchange(_exchange, _type, _opts).then(function() {
        ch.publish(_exchange, routingKey, new Buffer(JSON.stringify(msg)), opts);
        return ch.close();
      });
    });
  }

  return this;
}

module.exports = {
  create: exchange
}