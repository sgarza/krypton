Krypton.Relation.HasOne = Class(Krypton.Relation, 'HasOne').inherits(Krypton.Relation)({
  prototype : {
    fetch : function(records, children) {
      var relation = this;

      var recordIds = records.map(function(item) {
        return item[relation.ownerCol];
      });

      var query = relation.relatedModel.query();

      return query.whereIn(relation.relatedCol, recordIds)
        .then(function(result) {

          records.forEach(function(record) {
            var asoc = result.filter(function(item) {
              if (item[relation.relatedCol] === record[relation.ownerCol]) {
                return true;
              }
            })[0];

            record[relation.name] = query._createRecordInstances([asoc])[0];
          });

          return records.map(function(item) {
            return item[relation.name]
          });
        });
    }
  }
});

module.exports = Krypton.Relation.HasOne;
