var Checkit = require('checkit');

Module(Krypton, 'ValidationSupport')({
  prototype : {
    isValid : function() {
      var model = this;

      var checkit = new Checkit(this.constructor.validations);

      return checkit.run(model);
    }
  }
});
