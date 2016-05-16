var expect = require('chai').expect;

var _ = require('lodash');
var Knex = require('knex');
require('./../../');

describe('Krypton.Model Unit Tests', function() {

  it('Should create a model instance', function() {
    Class('MyModel').inherits(Krypton.Model)({});

    var model = new MyModel();

    expect(model).is.an.instanceof(MyModel);
  });

  it('Should fail if Model doesn\'t have a tableName', function() {
    Class('MyModel').inherits(Krypton.Model)({});

    expect(MyModel.query.bind(MyModel, 'query')).to.throw(Error);
    expect(MyModel.knexQuery.bind(MyModel, 'knexQuery')).to.throw(Error);
  });

  it('If attributes are given, Should remove all but attributes properties from database representation', function() {
    Class('Model').inherits(Krypton.Model)({
      tableName : 'Model',

      attributes : ['id', 'title']
    });

    var model = new Model({
      id : 1,
      title : 'title',
      description : 'description'
    });

    var json = model._getAttributes();

    expect(json.id).is.equal(1);
    expect(json.title).is.equal('title');
    expect(json.description).to.be.undefined;
  });

  it('Should parse relation declarations', function() {

    Class('Address').inherits(Krypton.Model)({});

    Class('Like').inherits(Krypton.Model)({});

    Class('User').inherits(Krypton.Model)({
      relations : {
        address : {
          type : 'HasOne',
          relatedModel : Address,
          ownerCol : 'address_id',
          relatedCol : 'id'
        },
        addresses : {
          type : 'HasMany',
          relatedModel : Address,
          ownerCol : 'id',
          relatedCol : 'user_id'
        },
        likes : {
          type : 'HasManyThrough',
          relatedModel : Like,
          ownerCol : 'id',
          relatedCol : 'id',
          through : {
            tableName : 'UserLikes',
            ownerCol : 'user_id',
            relatedCol : 'like_id'
          }
        }
      }
    });

    User._loadRelations();

    expect(User._relations).to.exists;
    expect(User._relations.address).to.exists;
    expect(User._relations.addresses).to.exists;
    expect(User._relations.likes).to.exists;
  });

  it('Parsed Relations should be instances of available relations', function() {

    Class('Address').inherits(Krypton.Model)({});

    Class('Like').inherits(Krypton.Model)({});

    Class('User').inherits(Krypton.Model)({
      relations : {
        address : {
          type : 'HasOne',
          relatedModel : Address,
          ownerCol : 'address_id',
          relatedCol : 'id'
        },
        addresses : {
          type : 'HasMany',
          relatedModel : Address,
          ownerCol : 'id',
          relatedCol : 'user_id'
        },
        likes : {
          type : 'HasManyThrough',
          relatedModel : Like,
          ownerCol : 'id',
          relatedCol : 'id',
          through : {
            tableName : 'UserLikes',
            ownerCol : 'user_id',
            relatedCol : 'like_id'
          }
        }

      }
    });

    User._loadRelations();

    expect(User._relations.address).is.an.instanceof(Krypton.Relation.HasOne);
    expect(User._relations.addresses).is.an.instanceof(Krypton.Relation.HasMany);
    expect(User._relations.likes).is.an.instanceof(Krypton.Relation.HasManyThrough);
  });

  it('Knex instance is inherited from super classes', function() {
    var knex = Knex({client : 'pg'});

    Krypton.Model.knex(knex);

    Class('User').inherits(Krypton.Model)({
      tableName : 'Users'
    });

    Class('User2').inherits(User)({
      tableName : 'Users'
    });

    expect(User.knex()).to.equal(knex);
    expect(User2.knex()).to.equal(knex);
  });

  it('.query() should be an instance of QueryBuilder', function() {
    Class('User').inherits(Krypton.Model)({
      tableName : 'Users'
    });

    expect(User.query()).is.an.instanceof(Krypton.QueryBuilder);
  });

  it('.toSQL() should return a string', function () {
    Class('User').inherits(Krypton.Model)({
      tableName: 'Users'
    });

    var toSQL = User.query().toSQL();

    expect(toSQL).to.be.an('object');
    expect(toSQL.method).to.equal('select');
    expect(toSQL.sql).to.be.a('string');
  });

  it('.raw() should be a shortcut to knex().raw', function() {
    var knex = Knex({client : 'pg'});

    Krypton.Model.knex(knex);

    Class('User').inherits(Krypton.Model)({
      tableName : 'Users'
    });

    var sql = User.raw('SELECT * FROM "Model" WHERE "id" = ?', [1]).toString();

    expect(sql).to.equal('SELECT * FROM "Model" WHERE "id" = \'1\'');
  });

  describe('.updateAttributes()', function () {

    it('Should return model', function () {
      Class('User').inherits(Krypton.Model)({
        tableName: 'Users'
      });

      var user = new User({ a: 1, b: 2 });

      var returnUser = user.updateAttributes({ a: 'undefined' }, false);

      expect(user).to.equal(returnUser);
    })

    it('Should replace prop in object with \'undefined\'', function () {
      Class('User').inherits(Krypton.Model)({
        tableName: 'Users'
      });

      var user = new User({ a: 1, b: 2 });

      user.updateAttributes({ a: 'undefined' }, true);

      expect(user.a).to.equal('undefined');
    });

    it('Shouldn\'t replace prop in object with \'undefined\'', function () {
      Class('User').inherits(Krypton.Model)({
        tableName: 'Users'
      });

      var user = new User({ a: 1, b: 2 });

      user.updateAttributes({ a: 'undefined' });
      user.updateAttributes({ a: 'undefined' }, false);

      expect(user.a).to.equal(1);
    });

    it('Should ignore undefined values', function () {
      Class('User').inherits(Krypton.Model)({
        tableName: 'Users'
      });

      var user = new User({ a: 1, b: 2 });

      user.updateAttributes({ a: undefined });
      user.updateAttributes({ a: undefined }, false);
      user.updateAttributes({ a: undefined }, true);

      expect(user.a).to.equal(1);
    });

  })

  describe('._getInstanceOrStaticKnex()', function() {

    it('Should throw an Error if there is not a static or instance knex', function() {
      var DynMod = Class({}, 'DynMod').inherits(DynamicModel1)({});

      // Ensure Model superclass doesn't have a knex instance attached.
      Krypton.Model._knex = null;

      var model = new DynMod({
        property1 : 'Hello Dynamic 2',
        property2 : 1
      });

      expect(model._getInstanceOrStaticKnex.bind(model, '_getInstanceOrStaticKnex')).to.throw(Error);
    });

    it('Should use the passed knex instance in .save({knex}) || .destroy({knex})but not set it in the model instance', function() {
      var DynMod = Class({}, 'DynMod').inherits(DynamicModel1)({
        tableName : 'DynMod'
      });

      // Ensure Model superclass doesn't have a knex instance attached.
      Krypton.Model._knex = null;

      var staticKnex = Knex({client : 'pg'});

      DynMod.knex(staticKnex);

      var model = new DynMod({
        property1 : 'Hello Dynamic 2',
        property2 : 1
      });

      var instanceKnex = Knex({client : 'pg'});
      // If a knex instance is passed to the methods .save() or .destroy()
      // it will be set in the instance._knex variable, so we are simulating
      // a call to any of those methods here:
      model._knex = instanceKnex;

      expect(model._getInstanceOrStaticKnex().client).to.be.eq(instanceKnex.client);
      expect(model._knex).to.be.equal(null);
    });

    it('Should use the passed knex instance in save({knex}) || .destroy({save}) and set it in the model instance', function() {
      var DynMod = Class({}, 'DynMod').inherits(DynamicModel1)({
        tableName : 'DynMod'
      });

      // Ensure Model superclass doesn't have a knex instance attached.
      Krypton.Model._knex = null;

      var staticKnex = Knex({client : 'pg'});

      var model = new DynMod({
        property1 : 'Hello Dynamic 2',
        property2 : 1
      });

      var instanceKnex = Knex({client : 'pg'});
      // If a knex instance is passed to the methods .save() or .destroy()
      // it will be set in the instance._knex variable, so we are simulating
      // a call to any of those methods here:
      model._knex = instanceKnex;

      expect(model._getInstanceOrStaticKnex().client).to.be.eq(instanceKnex.client);
      expect(model._knex).to.be.equal(instanceKnex);
    })





  });
});
