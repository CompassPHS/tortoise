var assert = require('chai').assert
  , sinon = require('sinon')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , amqp = require('amqplib')
  , connectionPool = require('../lib/connectionPool')

var p = function(v) {
  return new Promise(function(f) { f(v); });
}

var sandbox;

suite('connectionPool', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  test('connectionPool creates N number of connections', function() {
    var connectStub = sandbox.stub(amqp, 'connect').returns(p());

    var host = 'amqp://localhost';
    var connectionPoolCount = _.random(5,100);
    var connPool = connectionPool.create(host, connectionPoolCount);

    _.times(connectionPoolCount, function() {
      connPool.getNext();
    });

    assert(connectStub.alwaysCalledWithExactly(host));
    assert.equal(connectStub.callCount, connectionPoolCount);
  });

  test('getNext round robins between connections', function(done) {
    var connectStub = sandbox.stub(amqp, 'connect');

    var host = 'amqp://localhost';
    var connectionPoolCount = _.random(5,100);

    _.times(connectionPoolCount, function(i) {
      connectStub.onCall(i).returns(p({id:i}));
    });

    var connPool = connectionPool.create(host, connectionPoolCount);

    _.times(connectionPoolCount, function() {
      connPool.getNext();
    });

    Promise.all(_.map(_.range(connectionPoolCount * 2), function() { 
        return connPool.getNext() 
      })).then(function(conns) {
        _.each(conns, function(conn, idx) {
          assert.equal(conn.id, idx % connectionPoolCount);
        });
        done();
      });
  });

  test('getAll returns all connection promises', function(done) {
    var connectStub = sandbox.stub(amqp, 'connect');

    var host = 'amqp://localhost';
    var connectionPoolCount = _.random(5,100);

    _.times(connectionPoolCount, function(i) {
      connectStub.onCall(i).returns(p({id:i}));
    });

    var connPool = connectionPool.create(host, connectionPoolCount);

    _.times(connectionPoolCount, function() {
      connPool.getNext();
    });

    Promise.all(connPool.getAll()).then(function(conns) {
      assert.equal(conns.length, connectionPoolCount);
      assert.equal(_.uniq(_.pluck(conns, 'id')).length, connectionPoolCount);
      done();
    });
  });

})