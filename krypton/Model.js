/* globals Krypton, Class */
const _ = require('lodash');
const Promise = require('bluebird');

const runHooks = require('./utils/run-hooks.js');

Krypton.Model = Class(Krypton, 'Model').includes(Krypton.ValidationSupport)({

  ALLOWED_HOOKS: [
    'beforeValidation',
    'afterValidation',
    'beforeSave',
    'beforeCreate',
    'afterCreate',
    'beforeUpdate',
    'afterUpdate',
    'afterSave',
    'beforeDestroy',
    'afterDestroy',
  ],

  _knex: null,

  _relations: {},

  // instances should override this arrays instead
  preprocessors: [],
  processors: [],

  _preprocessors: [
    (data) => { // snakeCase-ise (to DB)
      const sanitizedData = {};

      Object.keys(data).forEach((property) => {
        sanitizedData[_.snakeCase(property)] = data[property];
      });

      return sanitizedData;
    },
  ],

  _processors: [
    (data) => { // camelCase-ise (from DB)
      const sanitizedData = [];

      data.forEach((item) => {
        const sanitizedItem = {};

        // Not an object so we shouldn't process it with this processor.
        if (!_.isObject(item)) {
          sanitizedData.push(item);
          return;
        }

        Object.keys(item).forEach((property) => {
          sanitizedItem[_.camelCase(property)] = item[property];
        });

        sanitizedData.push(sanitizedItem);
      });

      return sanitizedData;
    },
  ],

  tableName: null,

  primaryKey: 'id',

  validations: {},

  relations: {},

  attributes: [],

  transacting: null,

  // convenience methods
  _query(idOrWhere) {
    const query = this.query();

    if (typeof idOrWhere === 'object') {
      if (Array.isArray(idOrWhere)) {
        query.whereIn(this.primaryKey, idOrWhere);
      } else {
        query.where(idOrWhere);
      }
    }

    if (typeof idOrWhere === 'string' || typeof idOrWhere === 'number') {
      query.where(this.primaryKey, idOrWhere);
    }

    return query;
  },

  destroy(props) {
    return this._query(props).delete();
  },

  update(props, data) {
    return this.first(props).then((r) => {
      return r.updateAttributes(data).save();
    });
  },

  first(props) {
    return this._query(props).limit(1).then((results) => {
      return results[0];
    });
  },

  transaction(cb) {
    return this.knex().transaction(cb);
  },

  query(knex) {
    if (!this.tableName) {
      throw new Error('Model doesn\'t have a table name');
    }

    this._loadRelations(knex);

    const options = {};

    options.ownerModel = this;

    if (knex) {
      options.knex = knex;
    }

    return new Krypton.QueryBuilder(options);
  },

  _loadRelations(knex) {
    const relations = this.relations;

    const result = {};

    Object.keys(relations).forEach((relation) => {
      const config = this.relations[relation];

      config.name = relation;
      config.ownerModel = this;

      if (knex) {
        config.knex = knex;
      }

      const relationInstance = new Krypton.Relation[config.type](config);

      result[relation] = relationInstance;
    });

    this._relations = result;
  },

  knex(knex) {
    if (knex) {
      this._knex = knex;
      return knex;
    }

    let klass = this;

    while (klass && !klass._knex) {
      const proto = klass.prototype.__proto__;
      klass = proto && proto.constructor;
    }

    if (klass && klass._knex) {
      return klass && klass._knex;
    }

    throw new Error('Model doesn\'t have a knex instance');
  },

  raw(...args) {
    const knex = this.knex();

    return knex.raw.apply(null, args);
  },

  knexQuery() {
    if (!this.tableName) {
      throw new Error('Model doesn\'t have a table name');
    }

    return this.knex().table(this.tableName);
  },

  prototype: {
    init(config) {
      Object.keys(config || {}).forEach((propertyName) => {
        this[propertyName] = config[propertyName];
      }, this);

      return this;
    },

    transacting(trx) {
      this._trx = trx;
      return this;
    },

    updateAttributes(obj, allowUndefinedString) {
      allowUndefinedString = allowUndefinedString || false;

      // For further clarity I will now explain the allowUndefinedString param.
      // When the front end sends the back end values it may sometimes put in
      // an undefined value as the string 'undefined', which is by definition
      // not undefined, because it is a string.
      // The allowUndefinedString param allows you to control whether this
      // method will consider strings that are 'undefined' as undefined, i.e.
      // not update the current model with this value, or if it should consider
      // it OK and update the value as 'undefined', even if that string holds no
      // real value.
      // By default it will consider 'undefined' strings as not valuable and
      // will not replace the model's property with 'undefined', if the param
      // passed in is truthy then it'll replace the model's property with the
      // 'undefined' string.

      const filteredObj = {};

      Object.keys(obj).forEach((key) => {
        if (!_.isUndefined(obj[key])) {
          if (allowUndefinedString) {
            filteredObj[key] = obj[key];
          } else if (obj[key] !== 'undefined') {
            filteredObj[key] = obj[key];
          }
        }
      });

      _.assign(this, filteredObj);

      return this;
    },

    save(knex) {
      const model = this;
      const primaryKey = this.constructor.primaryKey;

      if (knex) {
        model._knex = knex;
      }

      let returnedData;

      return this.isValid() // beforeValidation and afterValidation hooks
        .then(() => {
          return runHooks(model._beforeSave);
        })
        .then(() => {
          return new Promise((resolve, reject) => {
            if (!model[primaryKey]) {
              Promise.resolve()
                .then(() => {
                  return runHooks(model._beforeCreate);
                })
                .then(() => {
                  let values = model._getAttributes();

                  (model.constructor._preprocessors.concat(model.constructor.preprocessors))
                    .forEach((proc) => {
                      values = proc.call(model, values);
                    });

                  return model._create(values);
                })
                .then((data) => {
                  returnedData = data;

                  return Promise.resolve();
                })
                .then(() => {
                  return runHooks(model._afterCreate);
                })
                .then(resolve)
                .catch(reject);
            } else {
              Promise.resolve()
                .then(() => {
                  return runHooks(model._beforeUpdate);
                })
                .then(() => {
                  let values = model._getAttributes();

                  (model.constructor._preprocessors.concat(model.constructor.preprocessors))
                    .forEach((proc) => {
                      values = proc.call(model, values);
                    });

                  return model._update(values);
                })
                .then((data) => {
                  returnedData = data;

                  return Promise.resolve();
                })
                .then(() => {
                  return runHooks(model._afterUpdate);
                })
                .then(resolve)
                .catch(reject);
            }
          });
        })
        .then(() => {
          return runHooks(model._afterSave);
        })
        .then(() => {
          return Promise.resolve(returnedData);
        });
    },

    _create(values) {
      const model = this;
      const primaryKey = this.constructor.primaryKey;

      // This may not make sense, but the reason it's here is because after a
      // bunch of mangling, this translates to "if the table has these".  I.e.
      // if these are values we can affect in the DB.
      if ({}.hasOwnProperty.call(values, 'created_at')) {
        values.created_at = new Date();
      }

      if ({}.hasOwnProperty.call(values, 'updated_at')) {
        values.updated_at = new Date();
      }

      if (values[primaryKey] === null) {
        delete values[primaryKey];
      }

      const knex = this._getInstanceOrStaticKnex();

      return knex
        .insert(values)
        .returning(primaryKey)
        .transacting(this._trx)
        .then((data) => {
          model[primaryKey] = data[0];

          // Read the comment above regarding this.
          if ({}.hasOwnProperty.call(values, 'created_at')) {
            model.createdAt = values.created_at;
          }

          if ({}.hasOwnProperty.call(values, 'updated_at')) {
            model.updatedAt = values.updated_at;
          }

          // Remove transaction
          model._trx = null;

          return Promise.resolve(data);
        })
        .catch((err) => {
          throw err;
        });
    },

    _update(values) {
      const model = this;

      const primaryKey = this.constructor.primaryKey;

      // This may not make sense, but the reason it's here is because after a
      // bunch of mangling, this translates to "if the table has these".  I.e.
      // if this is a value we can affect in the DB.
      if ({}.hasOwnProperty.call(values, 'updated_at')) {
        values.updated_at = new Date();
      }

      const knex = this._getInstanceOrStaticKnex();

      return knex
        .where(primaryKey, '=', values[primaryKey])
        .update(values)
        .returning(primaryKey)
        .transacting(this._trx)
        .then((data) => {
          // Read the comment above regarding this.
          if ({}.hasOwnProperty.call(values, 'updated_at')) {
            model.updatedAt = values.updated_at;
          }

          // Remove transaction
          model._trx = null;

          return Promise.resolve(data);
        })
        .catch((err) => {
          throw err;
        });
    },

    destroy(knex) {
      const model = this;
      const primaryKey = model.constructor.primaryKey;

      if (knex) {
        this._knex = knex;
      }

      return new Promise((resolve, reject) => {
        Promise.resolve()
          .then(() => {
            return runHooks(model._beforeDestroy);
          })
          .then(() => {
            const whereClause = {};

            whereClause[primaryKey] = model[primaryKey];

            const knexQuery = model._getInstanceOrStaticKnex();

            return knexQuery
              .delete()
              .where(whereClause)
              .then(() => {
                model[primaryKey] = null;

                return Promise.resolve();
              });
          })
          .then(() => {
            return runHooks(model._afterDestroy);
          })
          .then(() => {
            return resolve(model);
          })
          .catch(reject);
      });
    },

    _getAttributes() {
      const model = this;

      const values = _.clone(model);

      const sanitizedData = {};

      model.constructor.attributes.forEach((attribute) => {
        if (_.isUndefined(values[attribute])) {
          sanitizedData[attribute] = null;
        } else {
          sanitizedData[attribute] = values[attribute];
        }
      });

      return sanitizedData;
    },

    on(hook, handlers) {
      if (!this.constructor.ALLOWED_HOOKS.includes(hook)) {
        throw new Error(`Invalid model hook: ${hook}`);
      }

      if (!Array.isArray(handlers)) {
        handlers = [handlers];
      }

      if (!this[`_${hook}`]) {
        this[`_${hook}`] = [];
      }

      handlers.forEach((handler) => {
        this[`_${hook}`].push(handler);
      });

      return this;
    },

    _getInstanceOrStaticKnex() {
      /*
        instance.{save(knex) | destroy(knex)}

        let staticKnex to be instance.constructor.knex()

        if (staticKnex) then {
        override staticKnex with knex from the instance methods
        dont let instance._knex to be knex from the instance methods
        } else {
        let instance._knex to be knex from the instance methods
        }
      */

      let knex;

      try {
        // Have to put this inside a try block because .knex() will trow an error
        // if there is no knex instance attached to the class o superclass.
        const staticKnex = this.constructor.knex();

        if (staticKnex) {
          knex = this.constructor.knexQuery();

          if (this._knex) {
            knex = this._knex.table(this.constructor.tableName);
            this._knex = null;
          }
        } else {
          knex = this._knex.table(this.constructor.tableName);
        }
      } catch (e) {
        if (!this._knex) {
          throw e;
        }

        knex = this._knex.table(this.constructor.tableName);
      }

      return knex;
    },
  },
});

module.exports = Krypton.Model;
