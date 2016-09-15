/* globals Class, Krypton */
/* eslint prefer-spread: 0, arrow-body-style: 0, prefer-rest-params: 0, new-cap: 0 */

const _ = require('lodash');

Krypton.Relation.HasOne = Class(Krypton.Relation, 'HasOne').inherits(Krypton.Relation)({
  prototype: {
    fetch(records) {
      const relation = this;

      const recordIds = records.map((item) => item[_.camelCase(relation.ownerCol)]);

      const query = relation.relatedModel.query(this.knex);

      query.whereIn(relation.relatedCol, recordIds);

      if (relation.scope) {
        query.andWhere.apply(query, relation.scope);
      }

      return query.then((result) => {
        records.forEach((record) => {
          const asoc = result.filter((item) => {
            return (item[_.camelCase(relation.relatedCol)] ===
             record[_.camelCase(relation.ownerCol)]);
          })[0];

          if (_.isUndefined(asoc)) {
            record[relation.name] = null;
          } else {
            record[relation.name] = asoc;
          }
        });

        return records.map((item) => item[relation.name]);
      });
    },
  },
});

module.exports = Krypton.Relation.HasOne;
