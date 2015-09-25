var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Utils = require('./Utils');

require('./../../');

module.exports = function(session) {
  describe('Model destroy', function() {

    it('Should destroy a model', function() {
      return Model1.query().where({id : 1}).then(function(result) {
        var model = result[0];

        return model.destroy().then(function(res) {
          expect(model.id).to.be.null;
          expect(res.id).to.be.null;
          expect(res).is.an.instanceOf(Model1);
        });
      });
    });
  });
}
