var _ = require('lodash');
var Promise = require('bluebird');

Krypton.Model = Class(Krypton, 'Model').includes(Krypton.ValidationSupport, CustomEventSupport)({
  _knex : null,

  _relations : {},

  preprocessors : [function(data) {
    var sanitizedData, property;

    sanitizedData = {};

    for (property in data) {
      if (data.hasOwnProperty(property)) {
        sanitizedData[_.snakeCase(property)] = data[property];
      }
    }

    return sanitizedData;
  }],
  processors : [function(data) {
    var sanitizedData = [];

    if (data instanceof Array) {
      if (data.length > 0) {
        data.forEach(function(item) {
          if (item instanceof Object) {
            var sanitizedItem = {};

            for (var property in item) {
              if (item.hasOwnProperty(property)) {
                sanitizedItem[_.camelCase(property)] = item[property];
              }
            }

            sanitizedData.push(sanitizedItem);
          } else {
            sanitizedData.push(item);
          }
        });
      }
    }

    return sanitizedData;
  }],

  tableName : null,

  primaryKey : 'id',

  validations : {},

  relations : {},

  query : function() {
    if (!this.tableName) {
      throw new Error('Model doesn\'t have a table name');
    }

    var klass = this;

    this._loadRelations();

    return new Krypton.QueryBuilder({
      ownerModel : klass
    });
  },

  _loadRelations : function() {

    var relations = this.relations;

    for (var relation in relations) {
      if (relations.hasOwnProperty(relation)) {
        if (!this._relations[relation]) {
          var config = this.relations[relation];

          config.name = relation;
          config.ownerModel = this;

          var relationInstance = new Krypton.Relation[config.type](config);

          this._relations[relation] = relationInstance;
        }
      }
    }
  },

  knex : function(knex) {
    if (knex) {
      this._knex = knex;
      return knex;
    } else {
      var klass = this;

      while (klass && !klass._knex) {
        var proto = klass.prototype.__proto__;
        klass = proto && proto.constructor;
      }

      if (klass && klass._knex) {
        return klass && klass._knex;
      } else  {
        throw new Error('Model doesn\'t have a knex instance');;
      }
    }
  },

  raw : function() {
    var knex = this.knex();

    return knex.raw.apply(knex, arguments);
  },

  knexQuery : function() {
    if (!this.tableName) {
      throw new Error('Model doesn\'t have a table name');
    }

    return this.knex().table(this.tableName);
  },

  prototype : {
    init : function(config) {
      Object.keys(config || {}).forEach(function (propertyName) {
        this[propertyName] = config[propertyName];
      }, this);

      // if (this._preprocessors instanceof Array === false){
      //   this._preprocessors = [].concat(this.constructor.preprocessors);
      // } else {
      //   this._preprocessors = this._preprocessors.concat(this.constructor.preprocessors);
      // }

      return this;
    },

    save : function() {
      var model = this;

      var promise = Promise.resolve();

      promise = this.isValid();

      promise = promise.then(function(isValid) {
        var values = model._getAttributes();

        for (var i = 0; i < model.preprocessors.length; i++) {
          values = model.preprocessors[i](values);
        }

        if (!model.id) {
          return model._create(values);
        } else {
          return model._update(values);
        }

      }).catch(function(err) {
        model.errors = err
        return model;
      });

      return promise;
    },

    _create : function(values) {
      var model = this;

      var primaryKey = this.constructor.primaryKey;

      if (values.hasOwnProperty('created_at')) {
        values.created_at = new Date();
      }

      if (values.hasOwnProperty('updated_at')) {
        values.updated_at = new Date();
      }

      if (values[primaryKey] === null) {
        delete values[primaryKey];
      }

      return this.constructor.knexQuery()
        .insert(values)
        .returning(primaryKey)
        .then(function(data) {
          model[primaryKey] = data[0];

          return data;
        }).catch(function(err) {
          console.error('Query Error', err);
          return err;
        })
    },

    _update : function(values) {
      var primaryKey = this.constructor.primaryKey;

      if (values.hasOwnProperty('updated_at')) {
        values.updatedAt = new Date();
      }

      return this.constructor.knexQuery()
        .where(primaryKey, '=', values[primaryKey])
        .update(values)
        .returning(primaryKey)
        .then(function(data) {
          return data;
        }).catch(function(err) {
          console.error('Query Error', err);

          return err;
        });
    },

    destroy : function() {

    },

    _getAttributes : function() {
      var model = this;

      var values = _.clone(model);

      var sanitizedData = {};

      for (var property in model.constructor.attributes) {
        if (model.constructor.attributes.hasOwnProperty(property)) {
          sanitizedData[property] = values[property] || null;
        }
      }

      return sanitizedData;
    }
  }
});

module.exports = Krypton.Model;
