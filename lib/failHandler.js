var _ = require('lodash')
  , moment = require('moment')
  , util = require('util');

function failHandler(opts) {
  
  _.defaults(opts, {
    failSpan: 1000 * 60,
    retryTimeout: 1000 * 5
  });

  var failCount = 0
    , lastFail;

  var resetFail = function() {
    // If we have surpassed our span, reset fail count
    var added = moment(lastFail).add(opts.failSpan, 'milliseconds');
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

  instance.failSpan = function(failSpan) {
    opts['failSpan'] = failSpan;
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