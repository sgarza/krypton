global.Krypton = {};

require('neon');
require('neon/stdlib');

require('./krypton/ExpressionParser');
require('./krypton/Relation');
require('./krypton/relations/HasOne');
require('./krypton/relations/HasMany');
require('./krypton/relations/HasManyThrough');
require('./krypton/Knex');
require('./krypton/QueryBuilder');
require('./krypton/ValidationSupport');
require('./krypton/Model');

var Knex = require('knex');
// var pg = require('pg');

var knex = Knex({
    client : 'postgres',
    connection: {
        database: 'crowdvoice.by',
        user:     'sgarza',
        password: ''
    }
});


module.exports = global.Krypton;
