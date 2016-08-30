/* globals Krypton, Model, Class */

const expect = require('chai').expect;
const Knex = require('knex');
const Promise = require('bluebird');

describe('Krypton.Relation', () => {
  let OwnerModel = null;
  let RelatedModel = null;

  let mockKnexQueryResult = [];
  let executedQueries = [];
  let mockKnex = null;

  before(() => {
    mockKnex = Knex({ client: 'pg' });
    mockKnex.client.QueryBuilder.prototype.then = (callback, errorCallback) => {
      executedQueries.push(this.toString());
      return Promise.resolve(mockKnexQueryResult).then(callback, errorCallback);
    };
  });

  beforeEach(() => {
    mockKnexQueryResult = [];
    executedQueries = [];

    OwnerModel = Class('OwnerModel').inherits(Krypton.Model)({
      tableName: 'OwnerModel',
    });

    RelatedModel = Class('RelatedModel').inherits(Krypton.Model)({
      tableName: 'RelatedModel',
    });
  });

  it('Should create an instance of Krypton.Relation', () => {
    const relation = new Krypton.Relation({
      ownerModel: OwnerModel,
      relatedModel: RelatedModel,
      ownerCol: 'related_col_id',
      relatedCol: 'id',
    });

    expect(relation).is.an.instanceOf(Krypton.Relation);
  });

  it('Should fail if ownerModel is missing', () => {
    const relation = () => {
      return new Krypton.Relation({
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerModel is not a subclass of Krypton.Model', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: Class('Model')({}),
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should not fail if ownerModel is (eventually) a subclass of Krypton.Model', () => {
    const ParentClass = Class('ParentClass').inherits(Krypton.Model)({});

    const relation = () => {
      return new Krypton.Relation({
        ownerModel: Class('Model').inherits(ParentClass)({}),
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.not.throw(Error);
  });

  it('Should fail if relatedModel is missing', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should not fail if relatedModel is (eventually) a subclass of Krypton.Model', () => {
    const ParentClass = Class('ParentClass').inherits(Krypton.Model)({});

    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: Class('Model').inherits(ParentClass)({}),
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.not.throw(Error);
  });

  it('Should fail if relatedModel is not a subclass of Krypton.Model', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: Class('Model')({}),
        ownerCol: 'related_col_id',
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is missing', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is not a string', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 1,
        relatedCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should fail if relatedCol is missing', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'id',
      });
    };

    expect(relation).to.throw(Error);
  });

  it('Should fail if ownerCol is not a string', () => {
    const relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'id',
        relatedCol: 1,
      });
    };

    expect(relation).to.throw(Error);
  });

  it('If through is present, check if its format valid', () => {
    const relation = new Krypton.Relation({
      ownerModel: OwnerModel,
      relatedModel: RelatedModel,
      ownerCol: 'related_col_id',
      relatedCol: 'id',
      through: {
        tableName: 'JoinTable',
        ownerCol: 'owner_col_id',
        relatedCol: 'related_col_id',
      },
    });

    expect(relation).is.an.instanceof(Krypton.Relation);
  });

  it('Should fail if through is invalid', () => {
    let relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
        through: 1,
      });
    };

    expect(relation).to.throw(Error);

    relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
        through: {

        },
      });
    };

    expect(relation).to.throw(Error);

    relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
        through: [],
      });
    };

    expect(relation).to.throw(Error);

    relation = () => {
      return new Krypton.Relation({
        ownerModel: OwnerModel,
        relatedModel: RelatedModel,
        ownerCol: 'related_col_id',
        relatedCol: 'id',
        through: {
          tableName: 1,
          ownerCol: 1,
          relatedCol: 1,
        },
      });
    };

    expect(relation).to.throw(Error);
  });

  it('fetch should throw an error', () => {
    const relation = new Krypton.Relation({
      ownerModel: OwnerModel,
      relatedModel: RelatedModel,
      ownerCol: 'related_col_id',
      relatedCol: 'id',
    });

    expect(relation).is.an.instanceof(Krypton.Relation);
    expect(() => {
      return relation.fetch();
    }).to.throw(Error);
  });
});
