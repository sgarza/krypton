/* globals Model1, Model2, DynamicModel1, Class, DynamicModel2 */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const path = require('path');
const Knex = require('knex');

const truncate = require(path.join(__dirname, '..', 'truncate'));

const databaseConfig = {
  client: 'postgres',
  connection: {
    host: '127.0.0.1',
    database: 'krypton_test',
  },
};

describe('Model Update', () => {
  beforeEach(() => {
    return truncate([Model1, Model2]);
  });

  it('Should insert and update a model', () => {
    const model = new Model2({
      property1: 'Hello 1',
      property2: 1,
    });

    return model.save().then((result) => {
      expect(result).to.have.length(1);
      expect(model.id).is.eql(result[0]);

      return model.save().then((res) => {
        expect(res).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });
  });

  it('Should insert and update a model with a custom knex instance set on save()', () => {
    const model = new DynamicModel2({
      property1: 'Hello 1 Dynamic',
      property2: 1,
    });

    const knex = new Knex(databaseConfig);

    return model.save(knex).then((result) => {
      expect(result).to.have.length(1);
      expect(model.id).is.eql(result[0]);

      return model.save(knex).then((res) => {
        expect(res).to.have.length(1);
        expect(model.id).is.eql(result[0]);
      });
    });
  });

  it('Should update the updated_at attribute if it exists in Model.attributes', () => {
    const model = new Model2({
      property1: 'Hello 1',
      property2: 1,
    });

    return model.save().then((result) => {
      expect(result).to.have.length(1);
      expect(model.id).is.eql(result[0]);

      const oldUpdatedAt = new Date(model.updatedAt);

      return model.save().then((res) => {
        expect(res).to.have.length(1);
        expect(model.id).is.eql(result[0]);
        expect(model.updatedAt).is.not.eql(oldUpdatedAt);
      });
    });
  });
});
