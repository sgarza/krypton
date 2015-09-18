var Checkit = require('checkit');

Module(Krypton, 'ValidationSupport')({
  prototype : {
    isValid : function() {
      var model = this;

      this.dispatch('beforeValidate');

      if (!this.constructor.validations) {
        this.constructor.validations = {}
      }

      var checkit = new Checkit(this.constructor.validations);

      return checkit.run(model);

      // return checkit.run(model).then(function(validated) {
      //   model.dispatch('afterValidate');
      //   return validated;
      // }).catch(Checkit.Error, function(err) {
      //   return model.errors = err;
      // });
    }
  }
});
