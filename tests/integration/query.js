var expect = require('chai').expect;
var _ = require('lodash');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var Checkit = require('checkit');
var Knex = require('knex');

var databaseConfig = {
  client : 'postgres',
  connection: {
    host : '127.0.0.1',
    database : 'krypton_test'
  }
};


describe('Model static methods', function() {
  describe('Model.first()', function() {
    it('Should return the first row', function() {
      return Model1.first()
        .then(function(result) {
          expect(result).to.be.an.instanceof(Model1);
        });
    });
  });

  describe('Model.update()', function() {
    // it('Should update Model1 records where id:1', function() {
    //   return Model1.update({ id : 2 }, {property_3: {}})
    //     .then(function(result) {
    //       console.log(result)
    //       expect(result).to.be.an.instanceof(Model1);
    //     });
    // });
  });
});

describe('Model.query', function() {

  it('Should return all rows when no knex methods are chained', function() {
    return Model1.query()
      .then(function(result) {
        expect(result).to.have.length(5);
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
          expect(result).to.have.length(5);
          expect(result[0]).is.an.instanceOf(Model1);
          expect(result[1]).is.an.instanceOf(Model1);

          expect(_.uniq(_.flattenDeep(_.map(result, _.keys))).sort()).to.eql(['property1']);
        });
    });

    describe('pluck()', function () {
      before(function () {
        Model1.validations = {};

        var models = [
          new Model1({
            property3: {
              content_should_be_string: 'string'
            }
          }),
          new Model1({
            property3: {
              content_should_be_string: 'string'
            }
          }),
          new Model1({
            property3: {
              content_should_be_string: 'string'
            }
          })
        ];

        return Promise.all(models.map(function (m) { return m.save(); }));
      });

      it('Should handle integers properly', function () {
        return Model1.query()
          .whereNotNull('property_3')
          .pluck('id')
          .then(function (result) {
            expect(result.length).to.equal(3);

            result.forEach(function (r) {
              expect(_.isInteger(r)).to.equal(true);
            });
          });
      });

      it('Should handle objects properly', function () {
        return Model1.query()
          .whereNotNull('property_3')
          .pluck('property_3')
          .then(function (result) {
            expect(result.length).to.equal(3);

            result.forEach(function (r) {
              expect(_.isObject(r)).to.equal(true);
              expect(r.contentShouldBeString).to.not.exist;
              expect(r.content_should_be_string).to.exist;
            });
          });
      });

    });

  });

  describe('Load relations .include()', function() {
    beforeEach(function() {
      // return session.createDB();
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

    it('Should load a HasOne relation with a custom knex instance on query()', function() {
      var model1 = new DynamicModel1({
        property1 : 'Hello 1 Dynamic',
        property2 : 1
      });

      var relatedModel = new DynamicModel1({
        model1Id : 1,
        property1 : 'Hello 2 Dynamic',
        property2: 2
      });

      var knex = new Knex(databaseConfig);

      return model1.save(knex).then(function(res) {
        return relatedModel.save(knex).then(function() {
          return DynamicModel1.query(knex)
            .where({id : 2})
            .include('dynamicModel1Relation1')
            .then(function(result) {
              expect(result).to.have.length(1);
              expect(result[0]).is.an.instanceOf(DynamicModel1);
              expect(result[0].dynamicModel1Relation1).is.an.instanceOf(DynamicModel1);
              expect(result[0].dynamicModel1Relation1.id).is.eql(1);
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

    it('Should load a HasMany relation with a custom knex instance on query()', function() {
      var model1 = new DynamicModel1({
        property1 : 'Hello 1 Dynamic',
        property2 : 1
      });

      var relatedModel1 = new DynamicModel2({
        model1Id : 1,
        property1 : 'Hello 2 Dynamic',
        property2: 2
      });

      var relatedModel2 = new DynamicModel2({
        model1Id : 1,
        property1 : 'Hello 3 Dynamic',
        property2: 2
      });

      var knex = new Knex(databaseConfig);

      return Promise.all([
        model1.save(knex),
        relatedModel1.save(knex),
        relatedModel2.save(knex)
      ]).then(function() {
        return DynamicModel1.query(knex)
          .where({id : 1})
          .include('dynamicModel1Relation2')
          .then(function(result) {
            expect(result).to.have.length(1);
            expect(result[0].dynamicModel1Relation2).to.have.length(2);
            expect(result[0].dynamicModel1Relation2[0]).is.an.instanceOf(DynamicModel2);
            expect(result[0].dynamicModel1Relation2[1]).is.an.instanceOf(DynamicModel2);
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

      var joinTable = Model1.knex().table('Model1Model2')
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
        model2_2.save(),

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
              expect(result[1].model2Relation1[0]).is.an.instanceOf(Model1)
            });
        });

      });
    });

    it('Should load a HasManyThrough relation with a custom knex instance on query()', function() {
      var model1_1 = new DynamicModel1({
        property1 : 'Hello 1_1 Dyn',
      });

      var model1_2 = new DynamicModel1({
        property1 : 'Hello 1_2 Dyn',
      });

      var model2_1 = new DynamicModel2({
        property1 : 'Hello 2_1 Dyn',
      });

      var model2_2 = new DynamicModel2({
        property1 : 'Hello 2_2 Dyn',
      });

      var knex = new Knex(databaseConfig);

      var joinTable = knex.table('Model1Model2')
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
        model1_1.save(knex),
        model1_2.save(knex),
        model2_1.save(knex),
        model2_2.save(knex),

      ]).then(function() {
        return joinTable.then(function() {
          return DynamicModel2.query(knex)
            .include('dynamicModel2Relation1')
            .then(function(result) {
              expect(result).to.have.length(2);
              expect(result[0]).is.an.instanceOf(DynamicModel2);
              expect(result[1]).is.an.instanceOf(DynamicModel2);
              expect(result[0].dynamicModel2Relation1).to.have.length(2);
              expect(result[0].dynamicModel2Relation1[0]).is.an.instanceOf(DynamicModel1)
              expect(result[0].dynamicModel2Relation1[1]).is.an.instanceOf(DynamicModel1)
              expect(result[1].dynamicModel2Relation1[0]).is.an.instanceOf(DynamicModel1)
            });
        });

      });
    });
  });
});
