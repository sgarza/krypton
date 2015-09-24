var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Utils = require('./Utils');

require('./../../');

module.exports = function(session) {
  describe('Model Create', function() {

    it('Should insert a new model', function() {
      var model = new Model1({
        property1 : 'Hello 1',
        property2 : 1
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });

    it('Should set the created_at attribute if it exists in the Model.attributes', function() {
      var model = new Model2({
        property1 : 'Hello 2',
        property2 : 2
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
        expect(model.createdAt).is.an.instanceOf(Date);
      });
    });

    it('Should set the updated_at attribute if it exists in the Model.attributes', function() {
      var model = new Model2({
        property1 : 'Hello 2',
        property2 : 2
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
        expect(model.updatedAt).is.an.instanceOf(Date);
      });
    });
  });
}
