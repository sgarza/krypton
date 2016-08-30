/* globals Model1, Model2, DynamicModel1, Class */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const Knex = require('knex');
const path = require('path');

const truncate = require(path.join(__dirname, '..', 'truncate'));

const databaseConfig = {
  client: 'postgres',
  connection: {
    host: '127.0.0.1',
    database: 'krypton_test',
  },
};

describe('Create methods', () => {
  afterEach(() => {
    return truncate([Model1, Model2]);
  });

  describe('Model Create', () => {
    it('Should insert a new model', () => {
      const model = new Model1({
        property1: 'Hello 1',
        property2: 1,
      });

      return model.save().then((result) => {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });

    it('Should insert a new record with a custom knex instance set on save()', () => {
      const model = new DynamicModel1({
        property1: 'Hello Dynamic 1',
        property2: 1,
      });

      const knex = new Knex(databaseConfig);

      return model.save(knex).then((result) => {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });

    it('Should override the static knex instance but not set the custom knex instance in the Model\'s instance', () => {
      const DynMod = Class({}, 'DynMod').inherits(DynamicModel1)({});

      const staticKnex = new Knex(databaseConfig);

      DynMod.knex(staticKnex);

      const model = new DynMod({
        property1: 'Hello Dynamic 2',
        property2: 1,
      });

      const instanceKnex = new Knex(databaseConfig);

      return model.save(instanceKnex).then(() => {
        expect(model.constructor.knex()).to.be.equal(staticKnex);
        expect(model._knex).to.be.equal(null);
      }).catch(expect.fail);
    });

    it('Should use the custom knex instance and set it in the Model\'s instance', () => {
      const DynMod = Class({}, 'DynMod').inherits(DynamicModel1)({});

      const model = new DynMod({
        property1: 'Hello Dynamic 2',
        property2: 1,
      });

      const instanceKnex = new Knex(databaseConfig);

      return model.save(instanceKnex).then(() => {
        expect(model._knex).to.be.equal(instanceKnex);
      }).catch(expect.fail);
    });

    it('Should set the created_at attribute if it exists in the Model.attributes', () => {
      const model = new Model2({
        property1: 'Hello 2',
        property2: 2,
      });

      return model.save().then((result) => {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
        expect(model.createdAt).is.an.instanceOf(Date);
      });
    });

    it('Should set the updated_at attribute if it exists in the Model.attributes', () => {
      const model = new Model2({
        property1: 'Hello 2',
        property2: 2,
      });

      return model.save().then((result) => {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
        expect(model.updatedAt).is.an.instanceOf(Date);
      });
    });

    it('Should Pass the Model validations', () => {
      Model1.validations = {
        property1: ['required'],
      };

      const model = new Model1({
        property1: 'Hello 1',
      });

      return model.save().then((result) => {
        expect(result).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });

    it('Should Fail the Model validations', () => {
      Model1.validations = {
        property1: ['required'],
      };

      const model = new Model1({
        property2: 1,
      });

      return model
        .save()
        .then((result) => {
          expect.fail(result);
        })
        .catch((err) => {
          expect(err).to.exist;
        });
    });
  });

  describe('Model Save Hooks', () => {
    it('Should execute beforeValidation hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      // beforeValidation hook
      model.on('beforeValidation', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeValidation', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute afterValidation hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      // afterValidation hook
      model.on('afterValidation', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('afterValidation', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute beforeSave hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      // beforeSave hook
      model.on('beforeSave', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeSave', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute beforeCreate hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      // beforeCreate hook
      model.on('beforeCreate', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeCreate', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        expect(model.errors).to.be.undefined;
        expect(model.property2).to.be.eql(2);
      });
    });

    it('Should execute afterCreate hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      // afterCreate hook
      model.on('afterCreate', (next) => {
        Model2.query().then((result) => {
          model.count = result.length;
          next();
        });
      });

      model.on('afterCreate', (next) => {
        model.count++;
        next();
      });

      return model.save().then(() => {
        expect(model.errors).to.be.undefined;
        expect(model.count).to.be.eql(2);
      });
    });

    it('Should execute beforeUpdate hooks in order', () => {
      Model2.validations = {};

      return new Model2({}).save().then((result) => {
        Model2.query().where({ id: result[0] }).then((result) => {
          const model = result[0];

          // beforeUpdate hook
          model.on('beforeUpdate', (next) => {
            setTimeout(() => {
              model.property2 += 2;
              next();
            }, 200);
          });

          model.on('beforeUpdate', (next) => {
            model.property2++;
            next();
          });

          model.property2 = 1;

          return model.save().then((res) => {
            return Model2.query().where({ id: res[0] }).then(() => {
              expect(result[0].errors).to.be.undefined;
              expect(result[0].property2).to.be.eql(4);
            });
          });
        });
      });
    });


    it('Should execute afterUpdate hooks in order', () => {
      Model2.validations = {};

      const model = new Model2({
        id: 7,
      });

      model.on('afterUpdate', (next) => {
        Model2.query().then((res) => {
          model.count = res.length;
          next();
        });
      });

      model.on('afterUpdate', (next) => {
        model.count++;
        next();
      });

      return model.save().then(() => {
        expect(model.count).to.be.eql(1);
      });
    });

    it('Should execute afterSave hooks in order', () => {
      Model2.validations = {};

      const model = new Model2({
        id: 7,
      });

      model.on('afterSave', (next) => {
        Model2.query().then((res) => {
          model.count = res.length;
          next();
        });
      });

      model.on('afterSave', (next) => {
        model.count++;
        next();
      });

      return model.save().then(() => {
        expect(model.count).to.be.eql(1);
      });
    });
  });
});
