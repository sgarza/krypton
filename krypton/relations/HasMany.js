var _ = require('lodash');

Krypton.Relation.HasMany = Class(Krypton.Relation, 'HasMany').inherits(Krypton.Relation)({
  prototype : {
    fetch : function(records) {
      var relation = this;

      var recordIds = records.map(function(item) {
        return item[_.camelCase(relation.ownerCol)];
      });

      var query = relation.relatedModel.query();

      query.whereIn(relation.relatedCol, recordIds);

      if (relation.scope) {
        query.andWhere.apply(query, relation.scope);
      }

      return query.then(function(result) {
        records.forEach(function(record) {
          var asoc = result.filter(function(item) {
            if (item[_.camelCase(relation.relatedCol)] === record[_.camelCase(relation.ownerCol)]) {
              return true;
            }
          });

          record[relation.name] = asoc;
        });

        return records.map(function(item) {
          return item[relation.name]
        });
      });
    }
  }
});

module.exports = Krypton.Relation.HasMany;
