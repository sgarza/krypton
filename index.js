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
require('./krypton/Attachment');
require('./krypton/AttachmentStorage/Local');

module.exports = global.Krypton;
