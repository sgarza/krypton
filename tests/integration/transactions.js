/* globals Model1, Model2, DynamicModel1, Class, DynamicModel2 */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');
const Knex = require('knex');

const truncate = require(path.join(__dirname, '..', 'truncate'));

describe('Transactions', () => {
  beforeEach(() => {
    truncate([Model1, Model2]);
  });

  it('Sould save the transacting models', () => {
    const model1 = new Model1({
      property1: 'test1',
    });

    const model2 = new Model2({
      property1: 'test2',
    });

    return Model1.transaction((trx) => {
      model1.transacting(trx).save()
        .then(() => {
          return model2.transacting(trx).save();
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then((result) => {
      expect(result.length).to.be.equal(1);
    });
  });

  it('Sould fail the transaction if there are validation errors', () => {
    Model2.validations = {
      property1: ['required'],
    };

    const model1 = new Model1({
      property1: 'test1',
    });

    const model2 = new Model2({});

    return Model1.transaction((trx) => {
      model1.transacting(trx).save()
        .then(() => {
          return model2.transacting(trx).save();
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .then((result) => {
      expect.fail(result);
    })
    .catch((err) => {
      expect(err).to.be.exist;
    });
  });
});
