const Promise = require('bluebird');
const _ = require('lodash');

module.exports = (hookHandlers) => {
  return new Promise((resolve, reject) => {
    const hooks = hookHandlers || [];

    if (!_.isArray(hooks)) {
      throw new Error('hookHandlers argument is not an array');
    }

    Promise.each(hooks, (handler) => {
      return new Promise((res, rej) => {
        handler((err) => {
          if (err) { return rej(err); }

          return res();
        });
      });
    })
    .then(resolve)
    .catch(reject);
  });
};
