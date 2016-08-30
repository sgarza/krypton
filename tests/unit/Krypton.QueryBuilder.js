/* globals Krypton, Model, Class */

const expect = require('chai').expect;
const Knex = require('knex');
const Promise = require('bluebird');

describe('QueryBuilder', () => {
  let mockKnexQueryResult = [];
  let executedQueries = [];
  let mockKnex = null;

  before(() => {
    mockKnex = Knex({ client: 'pg' });
    mockKnex.client.QueryBuilder.prototype.then = function then(callback, errorCallback) {
      executedQueries.push(this.toString());
      return Promise.resolve(mockKnexQueryResult).then(callback, errorCallback);
    };
  });

  beforeEach(() => {
    mockKnexQueryResult = [];
    executedQueries = [];

    Class('Model').inherits(Krypton.Model)({
      tableName: 'Model',
    });

    Model.knex(mockKnex);
  });

  it('Should call the callback passed to .then after execution', () => {
    mockKnexQueryResult = [
      { a: 1 },
      { a: 2 },
    ];
    // Make sure the callback is called by not returning a promise from the test.
    // Instead call the `done` function so that the test times out if the callback
    // is not called.
    return Model.query().then((result) => {
      expect(result).to.have.length(2);
    });
  });

  it('Should return a promise from .then method', () => {
    const promise = Model.query().then();

    expect(promise).is.an.instanceof(Promise);
    return promise;
  });

  it('Should select all from the model table if no query methods are called', () => {
    const queryBuilder = Model.query();

    return queryBuilder.then(() => {
      expect(executedQueries).to.eql(['select * from "Model"']);
    });
  });

  it('Should have knex query builder methods', () => {
    // Doesn't test all the methods. Just enough to make sure the method calls are correctly
    // passed to the knex query builder.
    return Model.query()
      .select('name', 'id', 'age')
      .join('AnotherTable', 'AnotherTable.modelId', 'Model.id')
      .where('id', 10)
      .where('height', '>', '180')
      .where({ name: 'test' })
      .orWhere(function handler() {
        this.where('age', '<', 10).andWhere('eyeColor', 'blue');
      })
      .then(() => {
        expect(executedQueries[0]).to.equals([[
          'select "name", "id", "age" from "Model"',
          'inner join "AnotherTable" on "AnotherTable"."modelId" = "Model"."id"',
          'where "id" = \'10\'',
          'and "height" > \'180\'',
          'and "name" = \'test\'',
          'or ("age" < \'10\' and "eyeColor" = \'blue\')',
        ].join(' ')][0]);
      });
  });

  it('Should convert an array of query result into Model instances', () => {
    mockKnexQueryResult = [
      { a: 1 },
      { a: 2 },
    ];

    return Model.query().then((result) => {
      expect(result).to.have.length(2);
      expect(result[0]).is.an.instanceOf(Model);
      expect(result[1]).is.an.instanceOf(Model);
    });
  });
});
