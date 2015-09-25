var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Utils = require('./Utils');
var Checkit = require('checkit');

require('./../../');

module.exports = function(session) {
  describe('Model.query', function() {

    it('Should return all rows when no knex methods are chained', function() {
      return Model1.query()
        .then(function(result) {
          expect(result).to.have.length(2);
          expect(result[0]).is.an.instanceOf(Model1);
          expect(result[1]).is.an.instanceOf(Model1);
          expect(result[0].id).to.eql(1);
          expect(result[1].id).to.eql(2);
        });
    });

    describe('Knex Methods', function() {

      it('select()', function() {
        return Model1
          .query()
          .select('property_1')
          .then(function(result) {
            expect(result).to.have.length(2);
            expect(result[0]).is.an.instanceOf(Model1);
            expect(result[1]).is.an.instanceOf(Model1);

            expect(_.unique(_.flattenDeep(_.map(result, _.keys))).sort()).to.eql(['property1']);
          });
      });

    });

    describe('Load relations .include()', function() {
      beforeEach(function() {
        return session.createDB();
      });

      it('Should load a HasOne relation', function() {
        var model1 = new Model1({
          property1 : 'Hello 1',
          property2 : 1
        });

        var relatedModel = new Model1({
          model1Id : 1,
          property1 : 'Hello 2',
          property2: 2
        });

        return model1.save().then(function(res) {
          return relatedModel.save().then(function() {
            session.knex.on('query', function(data) {
              // console.log(data)
            })
            return Model1.query()
              .where({id : 2})
              .include('model1Relation1')
              .then(function(result) {

                expect(result).to.have.length(1);
                expect(result[0]).is.an.instanceOf(Model1);
                expect(result[0].model1Relation1).is.an.instanceOf(Model1);
                expect(result[0].model1Relation1.id).is.eql(1);
              });
          });
        });
      });

      it('Should load a HasMany relation', function() {
        var model1 = new Model1({
          property1 : 'Hello 1',
          property2 : 1
        });

        var relatedModel1 = new Model2({
          model1Id : 1,
          property1 : 'Hello 2',
          property2: 2
        });

        var relatedModel2 = new Model2({
          model1Id : 1,
          property1 : 'Hello 3',
          property2: 2
        });

        return Promise.all([
          model1.save(),
          relatedModel1.save(),
          relatedModel2.save()
        ]).then(function() {
          session.knex.on('query', function(data) {
            // console.log(data)
          })

          return Model1.query()
            .where({id : 1})
            .include('model1Relation2')
            .then(function(result) {
              expect(result).to.have.length(1);
              expect(result[0].model1Relation2).to.have.length(2);
              expect(result[0].model1Relation2[0]).is.an.instanceOf(Model2);
              expect(result[0].model1Relation2[1]).is.an.instanceOf(Model2);
            })
        });
      });

      it('Should load a HasManyThrough relation', function() {
        var model1_1 = new Model1({
          property1 : 'Hello 1_1',
        });

        var model1_2 = new Model1({
          property1 : 'Hello 1_2',
        });

        var model2_1 = new Model2({
          property1 : 'Hello 2_1',
        });

        var model2_2 = new Model2({
          property1 : 'Hello 2_2',
        });

        var joinTable = Krypton.Model.knex().table('Model1Model2')
          .insert([
            {
              id : 1,
              model_1_id : 1,
              model_2_id : 1
            },
            {
              id : 2,
              model_1_id : 1,
              model_2_id : 2
            },
            {
              id : 3,
              model_1_id : 2,
              model_2_id : 1
            }
          ]);

        return Promise.all([
          model1_1.save(),
          model1_2.save(),
          model2_1.save(),
          model2_2.save()
        ]).then(function() {
          return joinTable.then(function() {
            return Model2.query()
              .include('model2Relation1')
              .then(function(result) {
                expect(result).to.have.length(2);
                expect(result[0]).is.an.instanceOf(Model2);
                expect(result[1]).is.an.instanceOf(Model2);
                expect(result[0].model2Relation1).to.have.length(2);
                expect(result[0].model2Relation1[0]).is.an.instanceOf(Model1)
                expect(result[0].model2Relation1[1]).is.an.instanceOf(Model1)
                expect(result[1].model2Relation1).to.have.length(1);
                expect(result[1].model2Relation1[0]).is.an.instanceOf(Model1)
              });
          });

        });
      });
    });
  });
}
