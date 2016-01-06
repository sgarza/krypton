var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Utils = require('./Utils');
var Knex = require('knex');

var databaseConfig = {
  client : 'postgres',
  connection: {
    host : '127.0.0.1',
    database : 'krypton_test'
  }
};


require('./../../');

module.exports = function(session) {
  describe('Model Update', function() {

    it('Should insert and update a model', function() {
      var model = new Model2({
        property1 : 'Hello 1',
        property2 : 1
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);

        return model.save().then(function(result) {
          expect(result).to.have.length(1);
          expect(model.id).is.eql(result[0]);
        })
      });
    });

    it('Should insert and update a model with a custom knex instance set on save()', function() {
      var model = new DynamicModel2({
        property1 : 'Hello 1 Dynamic',
        property2 : 1
      });

      var knex = new Knex(databaseConfig);

      return model.save(knex).then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);

        return model.save(knex).then(function(result) {
          expect(result).to.have.length(1);
          expect(model.id).is.eql(result[0]);
        })
      });
    });

    it('Should update the updated_at attribute if it exists in Model.attributes', function() {
      var model = new Model2({
        property1 : 'Hello 1',
        property2 : 1
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);

        var oldUpdatedAt = new Date(model.updatedAt);

        return model.save().then(function(result) {
          expect(result).to.have.length(1);
          expect(model.id).is.eql(result[0]);
          expect(model.updatedAt).is.not.eql(oldUpdatedAt);
        })
      });
    });
  });
}
