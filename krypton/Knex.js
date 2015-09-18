var _ = require('lodash');

var queryMethod = function(methodName) {
  return function() {

    var args = new Array(arguments.length);

    for (var i = 0, l = arguments.length; i < l; ++i) {
      args[i] = arguments[i];
    }

    this._queryMethodCalls.push({
      method: methodName,
      args: args
    });

    return this;
  };
}

Krypton.Knex = Module(Krypton, 'Knex')({
  prototype : {
    _queryMethodCalls : null,

    _build : function() {
      var knexBuilder = this.ownerModel.knexQuery();

      _.each(this._queryMethodCalls, function (call) {
        knexBuilder[call.method].apply(knexBuilder, call.args);
      });

      return knexBuilder;
    },

    select : queryMethod('select'),

    where : queryMethod('where'),

    andWhere : queryMethod('andWhere'),

    orWhere : queryMethod('andWhere'),

    whereIn : queryMethod('whereIn'),

    join : queryMethod('join'),

    leftOuterJoin : queryMethod('leftOuterJoin'),
  }
});

module.exports = Krypton.Knex;
