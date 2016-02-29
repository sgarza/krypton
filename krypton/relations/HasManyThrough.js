var Promise = require('bluebird');
var _ = require('lodash');

Krypton.Relation.HasManyThrough = Class(Krypton.Relation, 'HasManyThrough').inherits(Krypton.Relation)({
  prototype : {
    fetch : function(records) {
      var relation = this;

      var promises = _.map(records, function(record) {
        var query = relation.relatedModel.query(relation.knex);

        query
          .select(relation.relatedModel.tableName + '.*')
          .from(relation.relatedModel.tableName)
          .leftJoin(
            relation.through.tableName,
            relation.relatedModel.tableName + '.' + relation.relatedCol,
            relation.through.tableName + '.' + relation.through.relatedCol
          )
          .where(relation.through.tableName + '.' + relation.through.ownerCol, '=', record[relation.ownerCol]);

        if (relation.scope) {
          query.andWhere.apply(query, relation.scope);
        }

        if (relation.orderBy) {
          query.orderBy.apply(query, relation.orderBy);
        }

        return query
          .then(function(results) {
            record[relation.name] = results;
          });
      });

      return Promise.all(promises).then(function() {
        return _.map(records, function(item) {
          return item[relation.name];
        })[0];
      });
    }
  }
});

module.exports = Krypton.Relation.HasManyThrough;
