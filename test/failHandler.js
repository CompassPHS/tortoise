var assert = require('chai').assert
  , failHandler = require('../lib/failHandler')
  , moment = require('moment');

suite('failHandler', function() {

  test('sets default options', function() {
    var opts = { failThresold: 10 };

    failHandler.create(opts);

    assert.isDefined(opts.failTimeout);
    assert.isDefined(opts.retryTimeout);
  });

  test('sets setter functions', function() {
    var opts = { };
    var instance = { };

    failHandler.extend(opts, instance);

    assert.isFunction(instance.failTimeout);
    assert.isFunction(instance.retryTimeout);
    assert.isFunction(instance.failThreshold);

    instance.failThreshold(10);
    instance.retryTimeout(1000);
    instance.failTimeout(10000);

    assert.equal(opts.failThreshold, 10);
    assert.equal(opts.retryTimeout, 1000);
    assert.equal(opts.failTimeout, 10000);
  });

  test('waits N seconds to invoke after threshold count', function(done) {
    var start = moment();
    console.log(+start);

    var fHandler = failHandler.create({
      failThreshold: 3,
      failTimeout: 50,
      retryTimeout: 25
    });

    fHandler.invoke(function() {
      assert.isBelow(moment().diff(start), 10);
    });

    fHandler.failed();
    fHandler.failed();
    fHandler.failed();

    fHandler.invoke(function() {
      assert.isAbove(moment().diff(start), 25);
      assert.isBelow(moment().diff(start), 100);

      setTimeout(function() {
        var start2 = moment();
        console.log(+start2);
        fHandler.invoke(function() {
          assert.isBelow(moment().diff(start2), 10);
          done();
        });
      }, 100);
    });
  });

});