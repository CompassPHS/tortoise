var _ = require('lodash')
  , moment = require('moment');

function failHandler(opts) {
  
  _.defaults(opts, {
    failTimeout: 1000 * 60,
    retryTimeout: 1000 * 5
  });

  var failCount = 0
    , lastFail;

  var resetFail = function() {
    // If we have surpassed our timeout, reset fail count
    var added = moment(lastFail).add(opts.failTimeout, 'milliseconds');
    if((lastFail && added < moment())) {
      failCount = 0;
    }
  }

  var retryTimeout = function() {
    resetFail();
    if(!opts.failThreshold || failCount < opts.failThreshold) {
      return 0;
    } else {
      return opts.retryTimeout;
    }
  }

  this.invoke = function(fn) {
    setTimeout(fn, retryTimeout());
  }

  this.success = function() {
    failCount = 0;
  }

  this.failed = function() {
    resetFail();
    failCount++;
    lastFail = moment();
  }

  return this;
}

var extend = function(opts, instance) {
  instance.failThreshold = function(failThreshold) {
    opts['failThreshold'] = failThreshold;
    return instance;
  }

  instance.failTimeout = function(failTimeout) {
    opts['failTimeout'] = failTimeout;
    return instance;
  }

  instance.retryTimeout = function(retryTimeout) {
    opts['retryTimeout'] = retryTimeout;
    return instance;
  }
}

module.exports = {
  create: failHandler,
  extend: extend
}