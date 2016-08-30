/* globals Model1, Model2, DynamicModel1, Class, DynamicModel2 */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');
const _ = require('lodash');
const Knex = require('knex');
const Promise = require('bluebird');

const truncate = require(path.join(__dirname, '..', 'truncate'));

const databaseConfig = {
  client: 'postgres',
  connection: {
    host: '127.0.0.1',
    database: 'krypton_test',
  },
};

describe('Model.query', () => {
  beforeEach(() => {
    Model1.validations = {};
    Model2.validations = {};
    return truncate([Model1, Model2]);
  });

  describe('Model static methods', () => {
    describe('Model.first()', () => {
      it('Should return the first row', () => {
        return new Model1().save().then(() => {
          return Model1.first()
            .then((result) => {
              expect(result).to.be.an.instanceof(Model1);
            });
        });
      });
    });
  });


  it('Should return all rows when no knex methods are chained', () => {
    return new Model1().save().then(() => {
      return Model1.query()
        .then((result) => {
          expect(result).to.have.length(1);
          expect(result[0]).is.an.instanceOf(Model1);
          expect(result[0].id).to.eql(1);
        });
    });
  });

  describe('Knex Methods', () => {
    it('select()', () => {
      return new Model1().save().then(() => {
        return Model1
          .query()
          .select('property_1')
          .then((result) => {
            expect(result).to.have.length(1);
            expect(result[0]).is.an.instanceOf(Model1);

            expect(_.uniq(_.flattenDeep(_.map(result, _.keys))).sort()).to.eql(['property1']);
          });
      });
    });

    describe('pluck()', () => {
      it('Should handle integers properly', () => {
        return new Model1({
          property3: {
            test: 'string',
          },
        }).save().then(() => {
          return Model1.query()
            .whereNotNull('property_3')
            .pluck('id')
            .then((result) => {
              expect(result.length).to.equal(1);

              result.forEach((r) => {
                expect(_.isInteger(r)).to.equal(true);
              });
            });
        });
      });

      it('Should handle objects properly', () => {
        return new Model1({
          property3: {
            content_should_be_string: 'string',
          },
        }).save().then(() => {
          return Model1.query()
            .whereNotNull('property_3')
            .pluck('property_3')
            .then((result) => {
              expect(result.length).to.equal(1);

              result.forEach((r) => {
                expect(_.isObject(r)).to.equal(true);
                expect(r.contentShouldBeString).to.not.exist;
                expect(r.content_should_be_string).to.exist;
              });
            });
        });
      });
    });
  });

  describe('Load relations .include()', () => {
    it('Should load a HasOne relation', () => {
      const model1 = new Model1({
        property1: 'Hello 1',
        property2: 1,
      });

      const relatedModel = new Model1({
        model1Id: 1,
        property1: 'Hello 2',
        property2: 2,
      });

      return model1.save().then(() => {
        return relatedModel.save().then(() => {
          return Model1.query()
            .where({ id: 2 })
            .include('model1Relation1')
            .then((result) => {
              expect(result).to.have.length(1);
              expect(result[0]).is.an.instanceOf(Model1);
              expect(result[0].model1Relation1).is.an.instanceOf(Model1);
              expect(result[0].model1Relation1.id).is.eql(1);
            });
        });
      });
    });

    it('Should load a HasOne relation with a custom knex instance on query()', () => {
      const model1 = new DynamicModel1({
        property1: 'Hello 1 Dynamic',
        property2: 1,
      });

      const relatedModel = new DynamicModel1({
        model1Id: 1,
        property1: 'Hello 2 Dynamic',
        property2: 2,
      });

      const knex = new Knex(databaseConfig);

      return model1.save(knex).then(() => {
        return relatedModel.save(knex).then(() => {
          return DynamicModel1.query(knex)
            .where({ id: 2 })
            .include('dynamicModel1Relation1')
            .then((result) => {
              expect(result).to.have.length(1);
              expect(result[0]).is.an.instanceOf(DynamicModel1);
              expect(result[0].dynamicModel1Relation1).is.an.instanceOf(DynamicModel1);
              expect(result[0].dynamicModel1Relation1.id).is.eql(1);
            });
        });
      });
    });

    it('Should load a HasMany relation', () => {
      const model1 = new Model1({
        property1: 'Hello 1',
        property2: 1,
      });

      const relatedModel1 = new Model2({
        model1Id: 1,
        property1: 'Hello 2',
        property2: 2,
      });

      const relatedModel2 = new Model2({
        model1Id: 1,
        property1: 'Hello 3',
        property2: 2,
      });

      return Promise.each([
        model1,
        relatedModel1,
        relatedModel2
      ], (model) => {
        return model.save();
      })
      .then(() => {
        return Model1.query()
          .where({ id: 1 })
          .include('model1Relation2')
          .then((result) => {
            expect(result).to.have.length(1);
            expect(result[0].model1Relation2).to.have.length(2);
            expect(result[0].model1Relation2[0]).is.an.instanceOf(Model2);
            expect(result[0].model1Relation2[1]).is.an.instanceOf(Model2);
          });
      });
    });

    it('Should load a HasMany relation with a custom knex instance on query()', () => {
      const model1 = new DynamicModel1({
        property1: 'Hello 1 Dynamic',
        property2: 1,
      });

      const relatedModel1 = new DynamicModel2({
        model1Id: 1,
        property1: 'Hello 2 Dynamic',
        property2: 2,
      });

      const relatedModel2 = new DynamicModel2({
        model1Id: 1,
        property1: 'Hello 3 Dynamic',
        property2: 2,
      });

      const knex = new Knex(databaseConfig);

      return Promise.each([
        model1,
        relatedModel1,
        relatedModel2
      ], (model) => {
        return model.save(knex);
      })
      .then(() => {
        return DynamicModel1.query(knex)
          .where({ id: 1 })
          .include('dynamicModel1Relation2')
          .then((result) => {
            expect(result).to.have.length(1);
            expect(result[0].dynamicModel1Relation2).to.have.length(2);
            expect(result[0].dynamicModel1Relation2[0]).is.an.instanceOf(DynamicModel2);
            expect(result[0].dynamicModel1Relation2[1]).is.an.instanceOf(DynamicModel2);
          });
      });
    });

    it('Should load a HasManyThrough relation', () => {
      const model11 = new Model1({
        property1: 'Hello 1_1',
      });

      const model12 = new Model1({
        property1: 'Hello 1_2',
      });

      const model21 = new Model2({
        property1: 'Hello 2_1',
      });

      const model22 = new Model2({
        property1: 'Hello 2_2',
      });

      const joinTable = Model1.knex().table('Model1Model2')
        .insert([
          {
            id: 1,
            model_1_id: 1,
            model_2_id: 1,
          },
          {
            id: 2,
            model_1_id: 1,
            model_2_id: 2,
          },
          {
            id: 3,
            model_1_id: 2,
            model_2_id: 1,
          },
        ]);

      return Promise.each([
        model11,
        model12,
        model21,
        model22,
      ], (model) => {
        return model.save();
      }).then(() => {
        return joinTable.then(() => {
          return Model2.query()
            .include('model2Relation1')
            .then((result) => {
              expect(result).to.have.length(2);
              expect(result[0]).is.an.instanceOf(Model2);
              expect(result[1]).is.an.instanceOf(Model2);
              expect(result[0].model2Relation1).to.have.length(2);
              expect(result[0].model2Relation1[0]).is.an.instanceOf(Model1);
              expect(result[0].model2Relation1[1]).is.an.instanceOf(Model1);
              expect(result[1].model2Relation1[0]).is.an.instanceOf(Model1);
            });
        });
      });
    });

    it('Should load a HasManyThrough relation with a custom knex instance on query()', () => {
      const model11 = new DynamicModel1({
        property1: 'Hello 1_1 Dyn',
      });

      const model12 = new DynamicModel1({
        property1: 'Hello 1_2 Dyn',
      });

      const model21 = new DynamicModel2({
        property1: 'Hello 2_1 Dyn',
      });

      const model22 = new DynamicModel2({
        property1: 'Hello 2_2 Dyn',
      });

      const knex = new Knex(databaseConfig);

      const joinTable = knex.table('Model1Model2')
        .insert([
          {
            id: 4,
            model_1_id: 1,
            model_2_id: 1,
          },
          {
            id: 5,
            model_1_id: 1,
            model_2_id: 2,
          },
          {
            id: 6,
            model_1_id: 2,
            model_2_id: 1,
          },
        ]);

      return Model1.knex()
        .raw(`truncate table "Model1Model2" RESTART IDENTITY cascade;`)
        .then(() => {
          return Promise.each([
            model11,
            model12,
            model21,
            model22,
          ], (model) => {
            return model.save(knex);
          }).then(() => {
            return joinTable.then(() => {
              return DynamicModel2.query(knex)
                .include('dynamicModel2Relation1')
                .then((result) => {
                  expect(result).to.have.length(2);
                  expect(result[0]).is.an.instanceOf(DynamicModel2);
                  expect(result[1]).is.an.instanceOf(DynamicModel2);
                  expect(result[0].dynamicModel2Relation1).to.have.length(2);
                  expect(result[0].dynamicModel2Relation1[0]).is.an.instanceOf(DynamicModel1);
                  expect(result[0].dynamicModel2Relation1[1]).is.an.instanceOf(DynamicModel1);
                  expect(result[1].dynamicModel2Relation1[0]).is.an.instanceOf(DynamicModel1);
                });
            });
          });
        });
    });
  });
});
