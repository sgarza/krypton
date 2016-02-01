var _ = require('lodash');
var Promise = require('bluebird');

Krypton.QueryBuilder = Class(Krypton, 'QueryBuilder').includes(Krypton.Knex)({
  prototype : {
    ownerModel : null,
    knex : null,

    _eagerExpression : null,

    init : function(config) {
      Object.keys(config || {}).forEach(function (propertyName) {
        this[propertyName] = config[propertyName];
      }, this);

      this._queryMethodCalls = [];

      return this;
    },

    then : function() {
      var promise = this._execute();
      return promise.then.apply(promise, arguments);
    },

    _execute : function() {
      var builder = this;
      var promise = Promise.resolve();

      var knexBuilder = this._build();

      promise = promise.then(function() {
        return knexBuilder;
      });

      promise = promise.then(function(records) {
        return builder._eagerFetch(records);
      }).then(function(records) {
        return records
      });

      // promise = promise.then(function(records) {
      //   return builder._createRecordInstances(records);
      // })

      return promise;
    },

    _createRecordInstances : function(records) {
      var builder = this;

      if (_.isNull(records) || _.isUndefined(records) || !_.isArray(records)) {
        return null;
      }

      // Run processors
      for (var i = 0; i < builder.ownerModel.processors.length; i++) {
        records = builder.ownerModel.processors[i](records);
      }


      if (records.length > 0 && _.isObject(records[0])) {
        for (var i = 0, l = records.length; i < l; ++i) {
          records[i] = new this.ownerModel(records[i]);
        }
      }

      return records;
    },

    include : function(expression) {
      var nodes = new Krypton.ExpressionParser(expression);

      this._eagerExpression = nodes.parse();

      return this;
    },

    _eagerFetch : function(records) {
      var builder = this;

      records =  builder._createRecordInstances(records);

      var promises = [];

      if (this._eagerExpression) {
        var nodes = this._eagerExpression.nodes;

        var currentModel = builder.ownerModel;

        var currentRecords = records;

        var iterate = function(a, isRoot) {
          return Promise.each(a, function(currentNode) {
            var p;

            if (isRoot) {
              currentModel = builder.ownerModel;
              currentRecords = records;
            }

            if (currentModel._relations.hasOwnProperty(currentNode.name)) {
              p =  currentModel._relations[currentNode.name].fetch(currentRecords).then(function(res) {

                if (currentNode.children.length > 0) {
                  currentRecords = res;
                  currentModel = currentModel._relations[currentNode.name].relatedModel;

                  return iterate(currentNode.children);
                }
              });
            }

            if (p) {
              return p;
            }
          });
        };



        promises = iterate(nodes, true);
      }

      var promise = Promise.all(promises)
        .then(function() {
          return records;
        });

      return promise;
    }
  }
})
