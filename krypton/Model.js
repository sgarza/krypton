var _ = require('lodash');
var Promise = require('bluebird');
var async = require('async');

Krypton.Model = Class(Krypton, 'Model').includes(Krypton.ValidationSupport)({
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
          var sanitizedItem = {};
          if (item instanceof Object) {
            for (var property in item) {
              if (item.hasOwnProperty(property)) {
                sanitizedItem[_.camelCase(property)] = item[property];
              }
            }

            sanitizedData.push(sanitizedItem);
          } else {
            for (var property in item) {
              if (item.hasOwnProperty(property)) {
                sanitizedItem[_.camelCase(property)] = item[property];
              }
            }

            sanitizedData.push(sanitizedItem);
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

  ALLOWED_HOOKS : [
    'beforeValidation',
    'afterValidation',
    'beforeSave',
    'beforeCreate',
    'afterCreate',
    'beforeUpdate',
    'afterUpdate',
    'afterSave'
  ],

  prototype : {
    init : function(config) {
      Object.keys(config || {}).forEach(function (propertyName) {
        this[propertyName] = config[propertyName];
      }, this);

      return this;
    },

    updateAttributes : function(obj) {
      _.assign(this, obj);
      return this;
    },

    save : function(knex) {
      var model = this;

      if (knex) {
        model._knex = knex;
      }

      var promise = Promise.resolve();

      promise = this.isValid();

      // AfterValidation
      var afterValidation = Promise.defer();

      promise.then(function() {
        async.eachSeries(model._afterValidation || [], function(handler, callback) {
          handler(callback);
        }, function(err) {
          afterValidation.resolve(err);
        });
      })
      .catch(function(err) {
        model.errors = err;
        afterValidation.resolve(err);
        return model;
      });

      return afterValidation.promise.then(function(err) {

        if (err) {
          throw new Error(err);
        }

        // BeforeSave hooks
        var beforeSave = Promise.defer();

        async.eachSeries(model._beforeSave || [], function(handler, callback) {
          handler(callback);
        }, function(err) {
          beforeSave.resolve(err);
        });

        return beforeSave.promise.then(function(err) {
          if (err) {
            throw new Error(err);
          }

          if (!model.id) {
            // beforeCreate hooks
            var beforeCreate = Promise.defer();

            async.eachSeries(model._beforeCreate || [], function(handler, callback) {
              handler(callback);
            }, function(err) {
              beforeCreate.resolve(err);
            });


            return beforeCreate.promise.then(function(err) {
              if (err) {
                throw new Error(err);
              }

              var values = model._getAttributes();

              for (var i = 0; i < model.constructor.preprocessors.length; i++) {
                values = model.constructor.preprocessors[i](values);
              }

              return model._create(values);
            });

          } else {
            // beforeUpdate hooks
            var beforeUpdate = Promise.defer();

            async.eachSeries(model._beforeUpdate || [], function(handler, callback) {
              handler(callback);
            }, function(err) {
              beforeUpdate.resolve(err);
            });

            return beforeUpdate.promise.then(function(err) {
              if (err) {
                throw new Error(err);
              }

              var values = model._getAttributes();

              for (var i = 0; i < model.constructor.preprocessors.length; i++) {
                values = model.constructor.preprocessors[i](values);
              }

              return model._update(values);
            });
          }
        });

      }).catch(function(err) {
        return err;
      });
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

      var knex;

      if (this._knex) {
        knex = this._knex.table(this.constructor.tableName);
      } else {
        knex = this.constructor.knexQuery();
      }

      return knex
        .insert(values)
        .returning(primaryKey)
        .then(function(data) {
          model[primaryKey] = data[0];

          if (values.hasOwnProperty('created_at')) {
            model.createdAt = values.created_at;
          }

          if (values.hasOwnProperty('updated_at')) {
            model.updatedAt = values.updated_at;
          }

          // AfterCreate hooks
          var afterCreate = Promise.defer();

          async.eachSeries(model._afterCreate || [], function(handler, callback) {
            handler(callback);
          }, function(err) {
            // throw new Error(err);
            afterCreate.resolve(err);
          });

          return afterCreate.promise.then(function(err) {
            if (err) {
              throw new Error(err);
            }

            var afterSave = Promise.defer();

            async.eachSeries(model._afterSave || [], function(handler, callback) {
              handler(callback);
            }, function(err) {
              afterSave.resolve(err);
            });

            return afterSave.promise.then(function() {
              return data;
            });
          });
        }).catch(function(err) {
          console.error('Query Error', err);
          return err;
        });
    },

    _update : function(values) {
      var model = this;

      var primaryKey = this.constructor.primaryKey;

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
          if (values.hasOwnProperty('updated_at')) {
            model.updatedAt = values.updated_at;
          }

          // AfterUpdate hooks
          var afterUpdate = Promise.defer();

          async.eachSeries(model._afterUpdate || [], function(handler, callback) {
            handler(callback);
          }, function(err) {
            afterUpdate.resolve(err);
          });

          return afterUpdate.promise.then(function(err) {
            if (err) {
              throw new Error(err);
            }

            var afterSave = Promise.defer();

            async.eachSeries(model._afterSave || [], function(handler, callback) {
              handler(callback);
            }, function(err) {
              afterSave.resolve(err);
            });

            return afterSave.promise.then(function() {
              return data;
            });
          });
        }).catch(function(err) {
          console.error('Query Error', err);
          return err;
        });
    },

    destroy : function(knex) {
      var model = this;

      if (knex) {
        this._knex = knex;
      }

      var primaryKey = this.constructor.primaryKey;

      var whereClause = {};
      whereClause[primaryKey] = model[primaryKey];

      var knex;

      if (this._knex) {
        knex = this._knex.table(this.constructor.tableName);
      } else {
        knex = this.constructor.knexQuery();
      }

      return knex
        .delete()
        .where(whereClause)
        .then(function() {
          model[primaryKey] = null;
          return model;
        });
    },

    _getAttributes : function() {
      var model = this;

      var values = _.clone(model);

      var sanitizedData = {};

      model.constructor.attributes.forEach(function(attribute) {
        sanitizedData[attribute] = values[attribute] || null;
      });

      return sanitizedData;
    },

    on :  function(hook, handlers) {
      if (this.constructor.ALLOWED_HOOKS.indexOf(hook) === -1) {
        throw new Error('Invalid model hook');
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
