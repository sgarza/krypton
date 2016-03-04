'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function (hookHandlers) {
  return new Promise(function (resolve, reject) {
    var hooks = hookHandlers || [];

    if (!_.isArray(hooks)) {
      throw new Error('hookHandlers argument is not an array');
    }

    Promise.each(hooks,
      function (handler) {
        return new Promise(function (resolve, reject) {
          handler(function (err) {
            if (err) { return reject(err); }

            return resolve();
          });
        });
      })
      .then(resolve)
      .catch(reject);
  });
};
