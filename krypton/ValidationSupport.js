/* global Module, Krypton */

const Checkit = require('checkit');

const runHooks = require('./utils/run-hooks.js');

Module(Krypton, 'ValidationSupport')({
  prototype: {
    isValid() {
      const model = this;

      // retrieve custom lenguage from instance, class or default
      const language = this.language || this.constructor.language || Checkit.language;

      const checkit = new Checkit(this.constructor.validations, { language });

      return runHooks(model._beforeValidation)
        .then(() => {
          return checkit.run(model);
        })
        .then(() => {
          return runHooks(model._afterValidation);
        });
    },
  },
});
