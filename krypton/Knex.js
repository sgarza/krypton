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

    joinRaw : queryMethod('joinRaw'),

    where : queryMethod('where'),

    andWhere : queryMethod('andWhere'),

    orWhere : queryMethod('orWhere'),

    whereRaw : queryMethod('whereRaw'),

    whereExists : queryMethod('whereExists'),

    orWhereExists : queryMethod('orWhereExists'),

    whereNot : queryMethod('whereNot'),

    whereNotExists : queryMethod('whereNotExists'),

    orWhereNotExists : queryMethod('orWhereNotExists'),

    whereIn : queryMethod('whereIn'),

    orWhereIn : queryMethod('orWhereIn'),

    whereNotIn : queryMethod('whereNotIn'),

    orWhereNotIn : queryMethod('orWhereNotIn'),

    whereNull : queryMethod('whereNull'),

    whereNotNull : queryMethod('whereNotNull'),

    orWhereNull : queryMethod('orWhereNull'),

    orWhereNotNull : queryMethod('orWhereNotNull'),

    whereBetween : queryMethod('whereBetween'),

    whereNotBetween : queryMethod('whereNotBetween'),

    orWhereBetween : queryMethod('orWhereBetween'),

    orWhereNotBetween : queryMethod('orWhereNotBetween'),

    groupBy : queryMethod('groupBy'),

    groupByRaw : queryMethod('groupByRaw'),

    orderBy : queryMethod('orderBy'),

    orderByRaw : queryMethod('orderByRaw'),

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

    first : queryMethod('first'),

    as : queryMethod('as'),

    pluck : queryMethod('pluck'),

    transacting : queryMethod('transacting'),

    forUpdate : queryMethod('forUpdate'),

    forShare : queryMethod('forShare'),


    page : function(page, pageSize) {
      page = page - 1;
      var start =  page * pageSize;
      var end = (page + 1) * pageSize - 1;

      return this.range(start, end);
    },

    range : function(start, end) {
      return this
        .limit(end - start + 1)
        .offset(start);
    }
  }
});

module.exports = Krypton.Knex;
