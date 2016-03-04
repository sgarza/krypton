var Checkit = require('checkit');

var runHooks = require('./utils/run-hooks.js');

Module(Krypton, 'ValidationSupport')({
  prototype : {
    isValid : function() {
      var model = this;

      var checkit = new Checkit(this.constructor.validations);

      return runHooks(model._beforeValidation)
        .then(function () {
          return checkit.run(model);
        })
        .then(function () {
          return runHooks(model._afterValidation);
        })
        .catch(function (err) {
          throw err;
        });
    }
  }
});
