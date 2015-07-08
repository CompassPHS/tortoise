var amqp = require('amqplib')
  , _ = require('lodash');

function connectionPool(amqpHost, count) {

  var nextConnIndex = 0;

  var connPromises = [];

  // Lazy evaluation of connection promises
  var connPromisesFns = _.map(_.range(count), function(id) {
    return function() {

      if(connPromises[id]) {
        return connPromises[id];
      }

      var p = amqp.connect(amqpHost);

      connPromises[id] = p;

      return p;
    }
  });

  var cycle = function() {
    if(++nextConnIndex === count) {
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