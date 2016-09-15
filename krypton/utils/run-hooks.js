const Promise = require('bluebird');

module.exports = (hookHandlers) => {
  return new Promise((resolve, reject) => {
    const hooks = hookHandlers || [];

    if (!Array.isArray(hooks)) {
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
