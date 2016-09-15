/* global Module, Krypton */

const Checkit = require('checkit');

const runHooks = require('./utils/run-hooks.js');

Module(Krypton, 'ValidationSupport')({
  prototype: {
    isValid() {
      const model = this;

      const checkit = new Checkit(this.constructor.validations);

      return runHooks(model._beforeValidation)
        .then(() => {
          return checkit.run(model);
        })
        .then(() => {
          return runHooks(model._afterValidation);
        });
    }
  }
});
