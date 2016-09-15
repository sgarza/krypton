/* globals Class, Krypton */
/* eslint prefer-spread: 0, arrow-body-style: 0, prefer-rest-params: 0, new-cap: 0 */


const Promise = require('bluebird');

Krypton.Relation.HasManyThrough = Class(Krypton.Relation,
  'HasManyThrough').inherits(Krypton.Relation)({
    prototype: {
      fetch(records) {
        const relation = this;

        return Promise.map(records, (record) => {
          const query = relation.relatedModel.query(relation.knex);

          query
            .select(`${relation.relatedModel.tableName}.*`)
            .from(relation.relatedModel.tableName)
            .leftJoin(
              relation.through.tableName,
              `${relation.relatedModel.tableName}.${relation.relatedCol}`,
              `${relation.through.tableName}.${relation.through.relatedCol}`
            )
            .where(`${relation.through.tableName}.${relation.through.ownerCol}`,
              '=', record[relation.ownerCol]);

          if (relation.scope) {
            query.andWhere.apply(query, relation.scope);
          }

          if (relation.orderBy) {
            query.orderBy.apply(query, relation.orderBy);
          }

          return query
            .then((results) => {
              record[relation.name] = results;
              return results;
            });
        });
      },
    },
  });

module.exports = Krypton.Relation.HasManyThrough;
