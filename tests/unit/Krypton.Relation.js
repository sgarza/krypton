var expect = require('chai').expect;

var _ = require('lodash');
var Knex = require('knex');
var Promise = require('bluebird');
require('./../../');

describe('Krypton.Relation', function() {
  var OwnerModel = null;
  var RelatedModel = null;

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

    OwnerModel = Class('OwnerModel').inherits(Krypton.Model)({
      tableName : 'OwnerModel'
    });

    RelatedModel = Class('RelatedModel').inherits(Krypton.Model)({
      tableName : 'RelatedModel'
    });
  });

  it('Should create an instance of Krypton.Relation', function() {
    var relation = new Krypton.Relation({
      ownerModel : OwnerModel,
      relatedModel : RelatedModel,
      ownerCol : 'related_col_id',
      relatedCol : 'id'
    });

    expect(relation).is.an.instanceOf(Krypton.Relation);
  });

  it('Should fail if ownerModel is missing', function() {
    var relation = function() {
      return new Krypton.Relation({
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerModel is not a subclass of Krypton.Model', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : Class('Model')({}),
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if relatedModel is missing', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if relatedModel is not a subclass of Krypton.Model', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : Class('Model')({}),
        ownerCol : 'related_col_id',
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is missing', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is not a string', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 1,
        relatedCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if relatedCol is missing', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'id'
      });
    }

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is not a string', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'id',
        relatedCol : 1
      });
    }

    expect(relation).to.throw(Error);
  });

  it('If through is present, check if its format valid', function() {
    var relation = new Krypton.Relation({
      ownerModel : OwnerModel,
      relatedModel : RelatedModel,
      ownerCol : 'related_col_id',
      relatedCol : 'id',
      through : {
        tableName : 'JoinTable',
        ownerCol : 'owner_col_id',
        relatedCol : 'related_col_id'
      }
    });

    expect(relation).is.an.instanceof(Krypton.Relation);
  });

  it('Should fail if through is invalid', function() {
    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id',
        through : 1
      });
    }

    expect(relation).to.throw(Error);

    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id',
        through : {

        }
      });
    }

    expect(relation).to.throw(Error);

    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id',
        through : []
      });
    }

    expect(relation).to.throw(Error);

    var relation = function() {
      return new Krypton.Relation({
        ownerModel : OwnerModel,
        relatedModel : RelatedModel,
        ownerCol : 'related_col_id',
        relatedCol : 'id',
        through : {
          tableName : 1,
          ownerCol : 1,
          relatedCol : 1
        }
      });
    }

    expect(relation).to.throw(Error);
  });


});
