/* globals Class, Krypton */
/* eslint prefer-spread: 0, arrow-body-style: 0, prefer-rest-params: 0, new-cap: 0 */

const _ = require('lodash');
const Promise = require('bluebird');

Krypton.QueryBuilder = Class(Krypton, 'QueryBuilder').includes(Krypton.Knex)({
  prototype: {
    ownerModel: null,
    knex: null,
    _eagerExpression: null,

    init(config) {
      Object.keys(config || {}).forEach((propertyName) => {
        this[propertyName] = config[propertyName];
      });

      this._queryMethodCalls = [];

      return this;
    },

    then() {
      const promise = this._execute();
      return promise.then.apply(promise, arguments);
    },

    toSQL() {
      return this._build().toSQL();
    },

    _execute() {
      return Promise.resolve()
        .then(() => {
          return this._build();
        })
        .then((records) => {
          return this._eagerFetch(records)
            .then((_records) => {
              return _records;
            });
        });
    },

    _createRecordInstances(records) {
      if (_.isNull(records) || _.isUndefined(records) || !_.isArray(records)) {
        return [];
      }

      const methodCallNames = this._queryMethodCalls.map((m) => m.method);

      if (methodCallNames.indexOf('pluck') === -1) {
        (this.ownerModel._processors.concat(this.ownerModel.processors))
          .forEach((proc) => {
            records = proc(records, this.ownerModel);
          });

        if (records.length > 0 && _.isObject(records[0])) {
          for (let i = 0; i < records.length; ++i) {
            records[i] = new this.ownerModel(records[i]);
          }
        }
      }

      return records;
    },

    include(expression) {
      const nodes = new Krypton.ExpressionParser(expression);

      this._eagerExpression = nodes.parse();

      return this;
    },

    _eagerFetch(records) {
      const builder = this;

      records = builder._createRecordInstances(records) || [];

      // Don't fetch relations if there are no records;
      if (records.length === 0) {
        return Promise.resolve([]);
      }

      let promises = [];

      if (this._eagerExpression) {
        const nodes = this._eagerExpression.nodes;

        let currentModel = builder.ownerModel;

        let currentRecords = records;

        const iterate = (_nodes, isRoot) => {
          return Promise.each(_nodes, (currentNode) => {
            if (isRoot) {
              currentModel = builder.ownerModel;
              currentRecords = records;
            }

            if ({}.hasOwnProperty.call(currentModel._relations, currentNode.name)) {
              return currentModel._relations[currentNode.name]
                .fetch(currentRecords).then((res) => {
                  if (currentNode.children.length > 0) {
                    currentRecords = res;
                    currentModel = currentModel._relations[currentNode.name].relatedModel;

                    return iterate(currentNode.children);
                  }

                  return false;
                });
            }

            return false;
          });
        };

        promises = iterate(nodes, true);
      }

      return Promise.all(promises)
        .then(() => {
          return records;
        });
    },
  },
});
