var _ = require('lodash');

Krypton.Relation = Class(Krypton, 'Relation')({
  prototype : {
    name : null,
    ownerModel : null,
    relatedModel : null,
    ownerCol : null,
    relatedCol : null,
    scope : null,
    /*
    through : {
      tableName : null,
      ownerCol : null,
      relatedCol : null,
      scope : null
    } */
    through : null,

    init : function(config) {
      if (!config.ownerModel) {
        throw new Error('Must provide an ownerModel');
      }

      if (config.ownerModel.superClass !== Krypton.Model) {
        throw new Error('ownerModel is not a subclass of Krypton.Model');
      }

      if (!config.relatedModel) {
        throw new Error('Must provide a relatedModel');
      }

      if (config.relatedModel.superClass !== Krypton.Model) {
        throw new Error('relatedModel is not a subclass of Krypton.Model');
      }

      if (!config.ownerCol || !_.isString(config.ownerCol)) {
        throw new Error('Invalid or missing ownerCol');
      }

      if (!config.relatedCol || !_.isString(config.relatedCol)) {
        throw new Error('Invalid or missing relatedCol');
      }

      if (config.through) {
        if (!_.isObject(config.through)) {
          throw new Error('Invalid through declaration');
        }

        if (!_.isString(config.through.tableName) || !_.isString(config.through.ownerCol) || !_.isString(config.through.relatedCol)) {
          throw new Error('Invalid through declaration');
        }
      }

      Object.keys(config || {}).forEach(function (propertyName) {
        this[propertyName] = config[propertyName];
      }, this);

      return this;
    },

    fetch : function() {
      throw Error('Not implemented');
    }
  }
});

module.exports = Krypton.Relation;
