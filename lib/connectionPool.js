var amqp = require('amqplib')
  , _ = require('lodash');

function connectionPool(amqpHost, count) {

  var nextConnIndex = 0;

  var connPromises = _.map(_.range(count), function() {
    return amqp.connect(amqpHost);
  });

  var cycle = function() {
    if(++nextConnIndex === count) {
      nextConnIndex = 0;
    }
  }

  this.getNext = function() {
    var connPromise = connPromises[nextConnIndex];
    cycle();
    return connPromise;
  }

  this.getAll = function() {
    return connPromises;
  }

  return this;

}

module.exports = {
  create: connectionPool
}