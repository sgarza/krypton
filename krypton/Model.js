var _ = require('lodash');
var Promise = require('bluebird');

var runHooks = require('./utils/run-hooks.js');

Krypton.Model = Class(Krypton, 'Model').includes(Krypton.ValidationSupport)({

  ALLOWED_HOOKS : [
    'beforeValidation',
    'afterValidation',
    'beforeSave',
    'beforeCreate',
    'afterCreate',
    'beforeUpdate',
    'afterUpdate',
    'afterSave',
    'beforeDestroy',
    'afterDestroy'
  ],

  _knex : null,

  _relations : {},

  preprocessors : [
    function(data) { // snakeCase-ise (to DB)
      var sanitizedData;
      var property;

      sanitizedData = {};

      for (property in data) {
        if (data.hasOwnProperty(property)) {
          sanitizedData[_.snakeCase(property)] = data[property];
        }
      }

      return sanitizedData;
    }
  ],

  processors : [
    function(data) { // camelCase-ise (from DB)
      var sanitizedData = [];

      data.forEach(function(item) {
        var sanitizedItem = {};

        // Not an object so we shouldn't process it with this processor.
        if (!_.isObject(item)) {
          sanitizedData.push(item);
          return;
        }

        for (var property in item) {
          if (item.hasOwnProperty(property)) {
            sanitizedItem[_.camelCase(property)] = item[property];
          }
        }

        sanitizedData.push(sanitizedItem);
      });

      return sanitizedData;
    }
  ],

  tableName : null,

  primaryKey : 'id',

  validations : {},

  relations : {},

  attributes : [],


  query : function(knex) {
    if (!this.tableName) {
      throw new Error('Model doesn\'t have a table name');
    }

    this._loadRelations(knex);

    var options = {};

    options.ownerModel = this;

    if (knex) {
      options.knex = knex;
    }

    return new Krypton.QueryBuilder(options);
  },

  _loadRelations : function(knex) {
    var relations = this.relations;

    var result = {};

    for (var relation in relations) {
      if (relations.hasOwnProperty(relation)) {
        var config = this.relations[relation];

        config.name = relation;
        config.ownerModel = this;

        if (knex) {
          config.knex = knex;
        }

        var relationInstance = new Krypton.Relation[config.type](config);

        result[relation] = relationInstance;
      }
    }

    this._relations = result;
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
        throw new Error('Model doesn\'t have a knex instance');
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

      return this;
    },

    updateAttributes : function(obj, undefinedString) {
      // should it replace values that are 'undefined' or consider them undefined?
      undefinedString = undefinedString || false;

      var filteredObj = {};

      Object.keys(obj).forEach(function (key) {
        // is not undefined
        if (!_.isUndefined(obj[key])) {
          // if undefined string is OK then continue
          if (undefinedString) {
            filteredObj[key] = obj[key];
          // if not, make sure string is not 'undefined'
          } else if (obj[key] !== 'undefined') {
            filteredObj[key] = obj[key];
          }
        }
      });

      _.assign(this, filteredObj);

      return this;
    },

    save : function(knex) {
      var model = this;
      var primaryKey = this.constructor.primaryKey;

      if (knex) {
        model._knex = knex;
      }

      var returnedData;

      return this.isValid() // beforeValidation and afterValidation hooks
        .then(function () {
          return runHooks(model._beforeSave);
        })
        .then(function () {
          return new Promise(function (resolve, reject) {
            if (!model[primaryKey]) {

              Promise.resolve()
                .then(function () {
                  return runHooks(model._beforeCreate);
                })
                .then(function () {
                  var values = model._getAttributes();

                  for (var i = 0; i < model.constructor.preprocessors.length; i++) {
                    values = model.constructor.preprocessors[i](values);
                  }

                  return model._create(values);
                })
                .then(function (data) {
                  returnedData = data;

                  return Promise.resolve();
                })
                .then(function () {
                  return runHooks(model._afterCreate);
                })
                .then(resolve)
                .catch(reject);

            } else {

              Promise.resolve()
                .then(function () {
                  return runHooks(model._beforeUpdate);
                })
                .then(function () {
                  var values = model._getAttributes();

                  for (var i = 0; i < model.constructor.preprocessors.length; i++) {
                    values = model.constructor.preprocessors[i](values);
                  }

                  return model._update(values);
                })
                .then(function (data) {
                  returnedData = data;

                  return Promise.resolve();
                })
                .then(function () {
                  return runHooks(model._afterUpdate);
                })
                .then(resolve)
                .catch(reject);

            }
          });
        })
        .then(function () {
          return runHooks(model._afterSave);
        })
        .then(function () {
          return Promise.resolve(returnedData);
        });
    },

    _create : function(values) {
      var model = this;
      var primaryKey = this.constructor.primaryKey;

      // This may not make sense, but the reason it's here is because after a
      // bunch of mangling, this translates to "if the table has these".  I.e.
      // if these are values we can affect in the DB.
      if (values.hasOwnProperty('created_at')) {
        values.created_at = new Date();
      }

      if (values.hasOwnProperty('updated_at')) {
        values.updated_at = new Date();
      }

      if (values[primaryKey] === null) {
        delete values[primaryKey];
      }

      var knex;

      if (this._knex) {
        knex = this._knex.table(this.constructor.tableName);
      } else {
        knex = this.constructor.knexQuery();
      }

      return knex
        .insert(values)
        .returning(primaryKey)
        .then(function (data) {
          model[primaryKey] = data[0];

          // Read the comment above regarding this.
          if (values.hasOwnProperty('created_at')) {
            model.createdAt = values.created_at;
          }

          if (values.hasOwnProperty('updated_at')) {
            model.updatedAt = values.updated_at;
          }

          return Promise.resolve(data);
        })
        .catch(function (err) {
          throw err;
        });
    },

    _update : function(values) {
      var model = this;

      var primaryKey = this.constructor.primaryKey;

      // This may not make sense, but the reason it's here is because after a
      // bunch of mangling, this translates to "if the table has these".  I.e.
      // if this is a value we can affect in the DB.
      if (values.hasOwnProperty('updated_at')) {
        values.updated_at = new Date();
      }

      var knex;

      if (this._knex) {
        knex = this._knex.table(this.constructor.tableName);
      } else {
        knex = this.constructor.knexQuery();
      }

      return knex
        .where(primaryKey, '=', values[primaryKey])
        .update(values)
        .returning(primaryKey)
        .then(function(data) {
          // Read the comment above regarding this.
          if (values.hasOwnProperty('updated_at')) {
            model.updatedAt = values.updated_at;
          }

          return Promise.resolve(data);
        })
        .catch(function (err) {
          throw err;
        });
    },

    destroy : function(knex) {
      var model = this;

      if (knex) {
        this._knex = knex;
      }

      return new Promise(function (resolve, reject) {
        Promise.resolve()
          .then(function () {
            return runHooks(model._beforeDestroy);
          })
          .then(function () {
            var primaryKey = model.constructor.primaryKey;

            var whereClause = {};
            whereClause[primaryKey] = model[primaryKey];

            var knex;

            if (model._knex) {
              knex = model._knex.table(this.constructor.tableName);
            } else {
              knex = model.constructor.knexQuery();
            }

            return knex
              .delete()
              .where(whereClause)
              .then(function () {
                model[primaryKey] = null;

                return Promise.resolve();
              });
          })
          .then(function () {
            return runHooks(model._afterDestroy);
          })
          .then(function () {
            return resolve(model);
          })
          .catch(reject);
      });
    },

    _getAttributes : function() {
      var model = this;

      var values = _.clone(model);

      var sanitizedData = {};

      model.constructor.attributes.forEach(function(attribute) {
        if (_.isUndefined(values[attribute])) {
          sanitizedData[attribute] = null;
        } else {
          sanitizedData[attribute] = values[attribute];
        }
      });

      return sanitizedData;
    },

    on : function(hook, handlers) {
      if (this.constructor.ALLOWED_HOOKS.indexOf(hook) === -1) {
        throw new Error('Invalid model hook: ' + hook);
      }

      if (!_.isArray(handlers)) {
        handlers = [handlers];
      }

      if (!this['_' + hook]) {
        this['_' + hook] = [];
      }

      handlers.forEach(function(handler) {
        this['_' + hook].push(handler);
      }.bind(this));

      return this;
    },
  }
});

module.exports = Krypton.Model;
