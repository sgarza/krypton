/* globals Model1, Model2, DynamicModel1, Class, DynamicModel2 */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');

const truncate = require(path.join(__dirname, '..', 'truncate'));

describe('Model.query', () => {
  beforeEach(() => {
    Model1.validations = {};
    Model2.validations = {};
    return truncate([Model1, Model2, DynamicModel1, DynamicModel2]);
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

    describe('Model.update()', () => {
      it('Should update a record', () => {
        return new Model1({
          property1: 'first',
        }).save().then(() => {
          return Model1.update({
            property_1: 'first',
          }, {
            property_1: 'second',
          })
          .then(() => {
            return Model1.first()
              .then((result) => {
                expect(result).to.be.an.instanceof(Model1);
                expect(result.property1).to.be.equal('second');
              });
          });
        });
      });
    });

    describe('Model.destroy()', () => {
      it('Should destroy a record', () => {
        return new Model1({
          property1: 'first',
        }).save().then(() => {
          return Model1.destroy({
            property_1: 'first',
          })
          .then(() => {
            return Model1.query()
              .then((result) => {
                expect(result.length).to.be.equal(0);
              });
          });
        });
      });
    });
  });
});
