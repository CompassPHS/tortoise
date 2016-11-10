var Promise = require('bluebird');

var validateAndParsePublish = function(msg) {
  // Validate msg
  var type = typeof msg;
  if((msg === null || msg === undefined) || (type !== 'number' && type !== 'string' && type !== 'object')) {
    return Promise.reject('payload property type must be one of: number, string, object');
  }

  // Parse to string if object
  if(type === 'object') {
    msg = JSON.stringify(msg);
  }

  return Promise.resolve(msg);
}

module.exports = {
  validateAndParsePublish: validateAndParsePublish
}