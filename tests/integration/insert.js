var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Utils = require('./Utils');
var Checkit = require('checkit');
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

    it('Should insert a new model with a custom knex instance set on save()', function() {

      var model1 = new DynamicModel1({
        property1 : 'Hello Dynamic 1',
        property2 : 1
      });

      var knex = new Knex(databaseConfig);

      return model1.save(knex).then(function(result) {
        expect(result).to.have.length(1);
        expect(model1.id).is.eql(result[0]);
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

    it('Should Pass the Model validations', function() {
      Model1.validations = {
        property1 : ['required']
      }

      var model = new Model1({
        property1 : 'Hello 1'
      });

      return model.save().then(function(result) {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });

    it('Should Fail the Model validations', function() {
      Model1.validations = {
        property1 : ['required']
      }

      var model = new Model1({
        property2 : 1
      });

      return model.save().then(function(result) {
        expect(model.errors).to.exists;
        expect(model.id).to.be.undefined;
      });
    });


  });

  describe('Model Hooks', function() {
    it('Should execute beforeValidation hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      // beforeValidation hook
      model.on('beforeValidation', function(next) {
        setTimeout(function() {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeValidation', function(next) {
        model.property2++;
        next();
      });

      return model.save().then(function(result) {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute afterValidation hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      // afterValidation hook
      model.on('afterValidation', function(next) {
        setTimeout(function() {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('afterValidation', function(next) {
        model.property2++;
        next();
      });

      return model.save().then(function(result) {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute beforeSave hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      // beforeSave hook
      model.on('beforeSave', function(next) {
        setTimeout(function() {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeSave', function(next) {
        model.property2++;
        next();
      });

      return model.save().then(function(result) {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute beforeCreate hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      // beforeCreate hook
      model.on('beforeCreate', function(next) {
        setTimeout(function() {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeCreate', function(next) {
        model.property2++;
        next();
      });

      return model.save().then(function(result) {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute afterCreate hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      // afterCreate hook
      model.on('afterCreate', function(next) {
        Model2.query().then(function(result) {
          // result.length => 7
          model.count = result.length;
          next();
        });
      });

      model.on('afterCreate', function(next) {
        model.count++;
        next();
      });

      return model.save().then(function(result) {
        expect(model.errors).to.be.undefined;
        expect(model.count).to.be.eql(8);
      });
    });

    it('Should execute beforeUpdate hooks in order', function(done) {
      Model2.validations = {};

      Model2.query().where({id : 1}).then(function(result) {
        var model = result[0];

        // beforeUpdate hook
        model.on('beforeUpdate', function(next) {
          setTimeout(function() {
            model.property2 = model.property2 + 2;
            next();
          }, 200);
        });

        model.on('beforeUpdate', function(next) {
          model.property2++;
          next();
        });

        model.property2 = 1;

        model.save().then(function(result) {
          Model2.query().where({id : result[0]}).then(function(result) {
            expect(result[0].errors).to.be.undefined;
            expect(result[0].property2).to.be.eql(4);
            done()
          });
        });


      });
    });


    it('Should execute afterCreate hooks in order', function() {
      Model2.validations = {};

      var model = new Model2();

      model.on('afterCreate', function(next) {
        Model2.query().then(function(res) {
          model.count = res.length;
          next();
        });
      });

      model.on('afterCreate', function(next) {
        model.count++;
        next();
      });

      return model.save().then(function(res) {
        expect(model.count).to.be.eql(9);
      })

    });

    it('Should execute afterUpdate hooks in order', function() {
      Model2.validations = {};

      var model = new Model2({
        id : 8
      });

      model.on('afterUpdate', function(next) {
        Model2.query().then(function(res) {
          model.count = res.length;
          next();
        });
      });

      model.on('afterUpdate', function(next) {
        model.count++;
        next();
      });

      return model.save().then(function(res) {
        expect(model.count).to.be.eql(9);
      })

    });

    it('Should execute afterSave hooks in order', function() {
      Model2.validations = {};

      var model = new Model2({
        id : 8
      });

      model.on('afterSave', function(next) {
        Model2.query().then(function(res) {
          model.count = res.length;
          next();
        });
      });

      model.on('afterSave', function(next) {
        model.count++;
        next();
      });

      return model.save().then(function(res) {
        expect(model.count).to.be.eql(9);
      })

    });
  });
}
