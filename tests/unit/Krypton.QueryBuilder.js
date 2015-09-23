var expect = require('chai').expect;

var _ = require('lodash');
var Knex = require('knex');
var Promise = require('bluebird');
require('./../../');

describe('QueryBuilder', function() {
  var mockKnexQueryResult = [];
  var executedQueries = [];
  var mockKnex = null;

  before(function() {
    mockKnex = Knex({client : 'pg'});
    mockKnex.client.QueryBuilder.prototype.then = function (callback, errorCallback) {
      executedQueries.push(this.toString());
      return Promise.resolve(mockKnexQueryResult).then(callback, errorCallback);
    };
  });

  beforeEach(function() {
    mockKnexQueryResult = [];
    executedQueries = [];

    Class('Model').inherits(Krypton.Model)({
      tableName : 'Model'
    });

    Model.knex(mockKnex);
  });

  xit('call() should execute the given function and pass the queryBuilder to it', function() {

  });

  it('Should call the callback passed to .then after execution', function (done) {
    mockKnexQueryResult = [{a: 1}, {a: 2}];
    // Make sure the callback is called by not returning a promise from the test.
    // Instead call the `done` function so that the test times out if the callback
    // is not called.
    Model.query().then(function (result) {
      expect(result).to.have.length(2);
      done();
    }).catch(done);
  });

  it('Should return a promise from .then method', function () {
    var promise = Model.query().then(function(){});

    expect(promise).is.an.instanceof(Promise);
    return promise;
  });

  xit('.map() should return a promise', function () {
    var promise = Model.query().map(_.identity);
    expect(promise).is.an.instanceof(Promise);
    return promise;
  });

  it('Should select all from the model table if no query methods are called', function () {
    var queryBuilder = Model.query();
    return queryBuilder.then(function () {
      expect(executedQueries).to.eql(['select * from "Model"']);
    });
  });

  it('Should have knex query builder methods', function () {
    // Doesn't test all the methods. Just enough to make sure the method calls are correctly
    // passed to the knex query builder.
    return Model.query()
      .select('name', 'id', 'age')
      .join('AnotherTable', 'AnotherTable.modelId', 'Model.id')
      .where('id', 10)
      .where('height', '>', '180')
      .where({name: 'test'})
      .orWhere(function () {
        this.where('age', '<', 10).andWhere('eyeColor', 'blue');
      })
      .then(function () {
        expect(executedQueries[0]).to.equals([[
          'select "name", "id", "age" from "Model"',
          'inner join "AnotherTable" on "AnotherTable"."modelId" = "Model"."id"',
          'where "id" = \'10\'',
          'and "height" > \'180\'',
          'and "name" = \'test\'',
          'or ("age" < \'10\' and "eyeColor" = \'blue\')'
        ].join(' ')][0]);
      });
  });

  it('Should convert an array of query result into Model instances', function() {
    mockKnexQueryResult = [{a : 1}, {a : 2}];

    return Model.query().then(function(result) {
      expect(result).to.have.length(2);
      expect(result[0]).is.an.instanceOf(Model);
      expect(result[1]).is.an.instanceOf(Model);
    });
  });

  xit('Should convert an object query result into a Model instances', function() {

  });
});
