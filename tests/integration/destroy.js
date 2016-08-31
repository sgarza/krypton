/* globals Model1, Model2, DynamicModel1, Class */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');

const truncate = require(path.join(__dirname, '..', 'truncate'));

describe('Destroy Methods', () => {
  afterEach(() => {
    truncate([Model1, Model2]);
  });

  describe('Model destroy', () => {
    it('Should destroy a model', () => {
      return new Model1({}).save().then(() => {
        return Model1.query().where({ id: 1 }).then((result) => {
          const model = result[0];

          return model.destroy().then((res) => {
            expect(model.id).to.be.null;
            expect(res.id).to.be.null;
            expect(res).is.an.instanceOf(Model1);
          });
        });
      });
    });
  });

  describe('Model Destroy Hooks', () => {
    it('Should execute beforeDestroy hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      model.on('beforeDestroy', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('beforeDestroy', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        return model.destroy().then((res) => {
          expect(model.property2).to.be.eql(2);
          expect(model.id).to.be.null;
          expect(res.id).to.be.null;
          expect(res).is.an.instanceOf(Model2);
        });
      });
    });

    it('Should execute afterDestroy hooks in order', () => {
      Model2.validations = {};

      const model = new Model2();

      model.on('afterDestroy', (next) => {
        setTimeout(() => {
          model.property2 = 1;
          next();
        }, 1000);
      });

      model.on('afterDestroy', (next) => {
        model.property2++;
        next();
      });

      return model.save().then(() => {
        return model.destroy().then((res) => {
          expect(model.property2).to.be.eql(2);
          expect(model.id).to.be.null;
          expect(res.id).to.be.null;
          expect(res).is.an.instanceOf(Model2);
        });
      });
    });
  });
});
