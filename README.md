[![Build Status](https://travis-ci.org/sgarza/krypton.svg?branch=master)](https://travis-ci.org/sgarza/krypton)
[![Code Climate](https://codeclimate.com/github/sgarza/krypton/badges/gpa.svg)](https://codeclimate.com/github/sgarza/krypton)
[![Test Coverage](https://codeclimate.com/github/sgarza/krypton/badges/coverage.svg)](https://codeclimate.com/github/sgarza/krypton/coverage)
[![NPM](https://nodei.co/npm/krypton-orm.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/krypton-orm)


W.I.P.
-----

**Krypton** is a full featured Javascript ORM for SQL Databases

Krypton Features:

- Declarative way of defining models
- Mechanism to eager load relations __*__
- Use the full feature-set of Knex.js __*__
- Easy to use transactions __*__
- Easy to declare validations
- Promise based

__*__ _Work in progress_

### Constraints

- Build arround [Neon](https://github.com/azendal/neon/)
- Use [Knex](http://knex.org) as the query builder
- DB **column_names** must be **snake_case**
- Don't handle migrations
- Don't handle database schema creation


### TODO

- This README
- Add more relation types, currently there are HasOne, HasMany and HasManyThrough.
- Add transactions

### Examples

```javascript
var Knex = require('knex');

// Create a knex instance
var knex = Knex({
  client: 'postgres',
  connection: {
    database: 'database-name',
    user:     'DBUser',
    password: 'DBPass'
  }
});

// Log queries
knex.on('query', function(data) {
  console.log(data);
});

// Bind the knex instance to the Krypton Base Model Class
// (Yes you can have multiple knex instances binded to different Models :) )
Krypton.Model.knex(knex);

// Create some Models
Class('Voice').inherits(Krypton.Model)({
  tableName : 'Voices',

  /*
    attributes are used for validation (whitelist) at saving. Whenever a
    model instance is saved it is checked against this schema.
  */
  attributes : ['id', 'title', 'description', 'createdAt', 'updatedAt']
});

Class('Entity').inherits(Krypton.Model)({
  tableName : 'Entities',

  attributes : ['id', ..., 'createdAt', 'updatedAt']
})

// This object defines the relations to other models.
// I intentionaly declared this outside the Entity Class because it has a circular
// relation ('organizations')
Entity.relations = {
  voices : {
    type : 'HasMany',
    relatedModel : Voice,
    ownerCol : 'id',
    relatedCol : 'owner_id'
  },

  organizations : {
    type : 'HasManyThrough',
    relatedModel : Entity,
    ownerCol : 'id',
    relatedCol : 'id',
    scope : ['Entities.type', '=', 'organization'],
    through : {
        tableName : 'EntityOwner',
        ownerCol : 'owner_id',
        relatedCol : 'owned_id'
        scope : null
    }
  }
}

Class('User').inherits(Krypton.Model)({
  tableName : 'Users',

  attributes : ['id', ..., 'createdAt', 'updatedAt'],

  relations : {
    entity : {
      type : 'HasOne',
      relatedModel : Entity,
      ownerCol : 'entity_id',
      relatedCol : 'id'
    }
  }
});
```

Queries

```javascript
var userQuery = User.query();
// => returns a QueryBuilder instance

userQuery.where({id : 1});
// or userQuery.where('id', '<', 5) or whatever knex expression you want to use.


// include(relationExpression)
// Relation expression is a simple DSL for expressing relation trees.
userQuery.include('entity.[voices, organizations]');
// This means: Load the User(s) and its entity and the voices of its entity and the organizations of its entity

userQuery.then(function(result) {
  console.log(result)
});

```
