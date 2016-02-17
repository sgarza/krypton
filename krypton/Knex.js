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
};

Krypton.Knex = Module(Krypton, 'Knex')({
  prototype : {
    _queryMethodCalls : null,

    _build : function() {
      var knexBuilder;

      if (this.knex) {
        knexBuilder = this.knex.table(this.ownerModel.tableName);
      } else {
        knexBuilder = this.ownerModel.knexQuery();
      }

      _.each(this._queryMethodCalls, function (call) {
        knexBuilder[call.method].apply(knexBuilder, call.args);
      });

      return knexBuilder;
    },

    insert : queryMethod('insert'),

    update : queryMethod('update'),

    patch : queryMethod('patch'),

    delete : queryMethod('delete'),

    select : queryMethod('select'),

    from : queryMethod('from'),

    into : queryMethod('into'),

    table : queryMethod('table'),

    distinct : queryMethod('distinct'),

    join : queryMethod('join'),

    innerJoin : queryMethod('innerJoin'),

    leftJoin : queryMethod('leftJoin'),

    leftOuterJoin : queryMethod('leftOuterJoin'),

    rightJoin : queryMethod('rightJoin'),

    rightOuterJoin : queryMethod('rightOuterJoin'),

    outerJoin : queryMethod('outerJoin'),

    fullOuterJoin : queryMethod('fullOuterJoin'),

    crossJoin : queryMethod('crossJoin'),

    where : queryMethod('where'),

    andWhere : queryMethod('andWhere'),

    orWhere : queryMethod('orWhere'),

    whereRaw : queryMethod('whereRaw'),

    whereExists : queryMethod('whereExists'),

    orWhereExists : queryMethod('orWhereExists'),

    whereNotExists : queryMethod('whereNotExists'),

    orWhereNotExists : queryMethod('orWhereNotExists'),

    whereIn : queryMethod('whereIn'),

    orWhereIn : queryMethod('orWhereIn'),

    whereNotIn : queryMethod('whereNotIn'),

    orWhereNotIn : queryMethod('orWhereNotIn'),

    whereNull : queryMethod('whereNull'),

    orWhereNull : queryMethod('orWhereNull'),

    whereNull : queryMethod('whereNotNull'),

    orWhereNull : queryMethod('orWhereNotNull'),

    whereBetween : queryMethod('whereBetween'),

    whereNotBetween : queryMethod('whereNotBetween'),

    orWhereBetween : queryMethod('orWhereBetween'),

    orWhereNotBetween : queryMethod('orWhereNotBetween'),

    groupBy : queryMethod('groupBy'),

    orderBy : queryMethod('orderBy'),

    union : queryMethod('union'),

    unionAll : queryMethod('unionAll'),

    having : queryMethod('having'),

    havingRaw : queryMethod('havingRaw'),

    offset : queryMethod('offset'),

    limit : queryMethod('limit'),

    count : queryMethod('count'),

    min : queryMethod('min'),

    max : queryMethod('max'),

    sum : queryMethod('sum'),

    avg : queryMethod('avg'),

    increment : queryMethod('increment'),

    decrement : queryMethod('decrement'),

    debug : queryMethod('debug'),

    returning : queryMethod('returning'),

    truncate : queryMethod('truncate'),

    toSQL : queryMethod('toSQL'),

    as : queryMethod('as')
  }
});

module.exports = Krypton.Knex;
