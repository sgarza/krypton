var Checkit = require('checkit');
var async = require('async');

Module(Krypton, 'ValidationSupport')({
  prototype : {
    isValid : function() {
      var model = this;

      var checkit = new Checkit(this.constructor.validations);

      // beforeValidation hooks
      var beforeValidation = Promise.defer();

      async.eachSeries(model._beforeValidation || [], function(handler, callback) {
        handler(callback)
      }, function(err) {
        if (err) {
          throw new Error(err);
        }

        beforeValidation.resolve(checkit.run(model))
      });

      return beforeValidation.promise;
    }
  }
});
