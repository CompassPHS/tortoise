var amqp = require('amqplib')
  , _ = require('lodash')
  , Promise = require('bluebird');

function connectionPool(amqpHost, options) {

  _.defaults(options, {
    connectRetries: 0,
    connectRetryInterval: 1000
  });

  var nextConnIndex = 0;

  var connPromises = [];

  // Lazy evaluation of connection promises
  var connPromisesFns = _.map(_.range(options.connectionPoolCount), function(id) {
    return function() {

      var connectRetries = 0;

      if(connPromises[id]) {
        return connPromises[id];
      }

      var connect = function() {
        return amqp.connect(amqpHost).catch(function(err) {
          if(err.code === 'ECONNREFUSED' && (++connectRetries <= options.connectRetries || options.connectRetries == -1)) {
            return Promise.delay(options.connectRetryInterval).then(function() {
              return connect();
            });
          } else {
            throw err;
          }
        });
      }

      var p = connect();

      connPromises[id] = p;

      return p;
    }
  });

  var cycle = function() {
    if(++nextConnIndex === options.connectionPoolCount) {
      nextConnIndex = 0;
    }
  }

  this.getNext = function() {
    var connPromiseFn = connPromisesFns[nextConnIndex];
    cycle();
    return connPromiseFn();
  }

  this.getAll = function() {
    return connPromises;
  }

  return this;

}

module.exports = {
  create: connectionPool
}