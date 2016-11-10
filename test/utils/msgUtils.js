var assert = require('chai').assert
  , sinon = require('sinon')
  , Promise = require('bluebird')
  , msgUtils = require('../../lib/utils/msgUtils')
  , _ = require('lodash');

suite('utils/msgUtils', function() {

  test('validateAndParsePublish parses and validates correctly', function(done) {

    var testCases = [
      {
        message: 'a',
        result: 'a'
      },
      {
        message: 1,
        result: 1
      },
      {
        message: { test: 'test' },
        result: JSON.stringify({ test: 'test' })
      },
      {
        message: null,
        expectFail: true
      },
      {
        message: undefined,
        expectFail: true
      },
      {
        expectFail: true
      },
      {
        message: true,
        expectFail: true
      },
      {
        message: false,
        expectFail: true
      }
    ];

    var testCasePromises = _.map(testCases, function(testCase) {
      return msgUtils.validateAndParsePublish(testCase.message)
        .then(function(message) {
          return message === testCase.result;
        })
        .catch(function(err) {
          return testCase.expectFail || false;
        });
    });

    Promise.all(testCasePromises)
      .then(function(results) {
        assert(_.every(results), 'A test case failed');
        done();
      });

  });

});