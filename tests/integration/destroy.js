/* globals Model1, Model2, DynamicModel1, Class */
/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const Knex = require('knex');
const path = require('path');

const truncate = require(path.join(__dirname, '..', 'truncate'));

describe('Model destroy', () => {
  afterEach(() => {
    truncate([Model1]);
  });

  it('Should destroy a model', () {
    return Model1.query().where({id : 1}).then(function(result) {
      var model = result[0];

      return model.destroy().then(function(res) {
        expect(model.id).to.be.null;
        expect(res.id).to.be.null;
        expect(res).is.an.instanceOf(Model1);
      });
    });
  });

});

describe('Model Destroy Hooks', function () {
  it('Should execute beforeDestroy hooks in order', function () {
    Model2.validations = {};

    var model = new Model2();

    model.on('beforeDestroy', function(next) {
      setTimeout(function() {
        model.property2 = 1;
        next();
      }, 1000);
    });

    model.on('beforeDestroy', function(next) {
      model.property2++;
      next();
    });

    return model.destroy().then(function(res) {
      expect(model.property2).to.be.eql(2);
      expect(model.id).to.be.null;
      expect(res.id).to.be.null;
      expect(res).is.an.instanceOf(Model2);
    });
  });

  it('Should execute afterDestroy hooks in order', function () {
    Model2.validations = {};

    var model = new Model2();

    model.on('afterDestroy', function(next) {
      setTimeout(function() {
        model.property2 = 1;
        next();
      }, 1000);
    });

    model.on('afterDestroy', function(next) {
      model.property2++;
      next();
    });

    return model.destroy().then(function(res) {
      expect(model.property2).to.be.eql(2);
      expect(model.id).to.be.null;
      expect(res.id).to.be.null;
      expect(res).is.an.instanceOf(Model2);
    });
  });
});
