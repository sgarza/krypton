const Promise = require('bluebird');
const _ = require('lodash');
const knex = require('knex')({
  client: 'postgres',
  connection: {
    host: '127.0.0.1',
    database: 'krypton_test',
  },
});

module.exports = (models) => {
  if (!_.isArray(models)) {
    models = [models];
  }

  return Promise.each(models, (model) => {
    return knex.raw(`truncate table "${model.tableName}" RESTART IDENTITY cascade;`);
  });
};
