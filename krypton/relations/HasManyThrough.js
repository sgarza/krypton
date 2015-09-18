var Promise = require('bluebird');
var _ = require('lodash');

Krypton.Relation.HasManyThrough = Class(Krypton.Relation, 'HasManyThrough').inherits(Krypton.Relation)({
  prototype : {
    fetch : function(records) {
      var relation = this;

      var promises = _.map(records, function(record) {
        var joinQuery = Krypton.Model.knex().table(relation.ownerModel.tableName);
        var relatedQuery = relation.relatedModel.query();

        joinQuery
          .select(relation.ownerModel.tableName + '.' + relation.ownerCol,
            relation.joinTable + '.' + relation.joinTableRelatedCol)
          .leftOuterJoin(relation.joinTable,
            relation.joinTable + '.' + relation.joinTableOwnerCol,
            relation.ownerModel.tableName + '.' + relation.ownerCol)
          .where(relation.ownerModel.tableName + '.' + relation.ownerCol, '=', record[relation.ownerCol]);

        joinQuery.then(function(joinResults) {
            var relatedIds = joinResults.map(function(item) {
              return item[relation.joinTableRelatedCol];
            });

            relatedQuery.whereIn(relation.relatedCol, relatedIds)

            if (relation.scope) {
              relatedQuery.andWhere.apply(relatedQuery, relation.scope);
            }
          });

        return joinQuery.then(function() {
          return relatedQuery.then(function(results) {
            record[relation.name] = relatedQuery._createRecordInstances(results);
          });
        })
      });

      return Promise.all(promises).then(function() {
        return _.map(records, function(item) {
          return item[relation.name];
        });
      });
    }
  }
});

module.exports = Krypton.Relation.HasMany;
