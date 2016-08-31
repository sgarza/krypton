[![Build Status](https://travis-ci.org/sgarza/krypton.svg?branch=master)](https://travis-ci.org/sgarza/krypton)
[![Code Climate](https://codeclimate.com/github/sgarza/krypton/badges/gpa.svg)](https://codeclimate.com/github/sgarza/krypton)
[![Test Coverage](https://codeclimate.com/github/sgarza/krypton/badges/coverage.svg)](https://codeclimate.com/github/sgarza/krypton/coverage)
[![NPM](https://nodei.co/npm/krypton-orm.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/krypton-orm)

# Krypton ORM

**Krypton** is a full featured Javascript ORM for SQL Databases

Krypton Features:

- Declarative way of defining models
- Mechanism to eager load relations
- Easy to declare validations
- Promise based

## Constraints

- Build with [Neon](https://github.com/azendal/neon/)
- Use [Knex](http://knex.org) as the query builder
- DB **column_names** must be **snake_case**
- Don't handle migrations
- Don't handle database schema creation

## Installation

```sh
$ npm install knex --save
$ npm install krypton-orm --save

# Then add one of the following:
$ npm install pg
$ npm install mysql
$ npm install mariasql
$ npm install sqlite3
```
You can bind a [knex](http://knexjs.org) instance to the Krypton Model Super Class (Yes you can have multiple knex instances binded to different Models :) )

The [knex documentation](http://knexjs.org) provides a number of examples for different databases.


```javascript
require('krypton-orm');

const knex = require('knex')({
  client: 'postgres',
  connection: {
    database: 'database-name',
    user:     'DBUser',
    password: 'DBPass'
  }
});

Krypton.Model.knex(knex);

// Create a Model Sub-Class
Class('User').inherits(Krypton.Model)({
  tableName : 'Users',

  /*
    attributes are used for validation (whitelist) at saving. Whenever a
    model instance is saved its properties are checked against this schema.
  */
  attributes : ['id', 'email', 'password', 'createdAt', 'updatedAt']
});
```

This initialization should likely only ever happen once in your application. As it creates a connection pool for the current database.

## Examples

```javascript
const User = Class('User').inherits(Krypton.Model)({
  tableName: 'Users',
  attributes: ['id', 'email', 'encryptedPassword', 'createdAt', 'updatedAt'],
});

const Account = Class('Account').inherits(Krypton.Model)({
    tableName: 'Account',
    attributes: ['id', 'userId', 'name', 'lastname', 'createdAt', 'updatedAt'],
    prototype: {
        fullname() {
            return `${this.name} ${this.lastname}`;
        }
    }
});

// Relations

User.relations = {
  account : {
    type : 'HasOne',
    relatedModel : Account,
    ownerCol : 'id',
    relatedCol : 'user_id'
  }
}
```

### Queries

```javascript
User.query();
// => returns a QueryBuilder instance
// You can chain any knex method here

userQuery.where({id : 1});
// or userQuery.where('id', '<', 5) or whatever knex expression you want to use.


// include(relationExpression)
// Relation expression is a simple DSL for expressing relation trees.
// This means: Load the User(s) and its account.
userQuery.include('account');

userQuery.then((result) => {
  console.log(result)
  // =>
  // {
  //     id: x,
  //     email: ...,
  //     encryptedPassword: ...,
  //     account: {...},
  //     createdAt: ...,
  //     updatedAt:...,
  // }
});

```

### ActiveRecord Style callbacks

Callbacks are hooks into the life cycle of an Krypton Model instance that allow you to trigger logic before or after an alteration of the object state.

 - Implemented callbacks:
    - beforeValidation
    - afterValidation
    - beforeSave
    - beforeCreate
    - beforeUpdate
    - afterCreate
    - afterUpdate
    - afterSave
    - beforeDestroy
    - afterDestroy

API:

```javascript
// @property on <public> [Function]
// @method
// @argument hook <required> [String]
// @argument handler(callback) <required> [Function]
// @return this;
```

Examples:

```javascript
Class('User').inherits(Krypton.Model)({
    prototype : {
        init : function(config) {
            Krypton.Model.prototype.init.call(this, config);

            var model = this;

            // If password is present hash password and set it as encryptedPassword
            model.on('beforeSave', (done) => {
                if (!model.password) {
                    return done();
                }

                bcrypt.hash(model.password, bcrypt.genSaltSync(10), null, (err, hash) => {
                    if (err) {
                        return done(err);
                    }

                    model.encryptedPassword = hash;

                    model.password = null;

                    return done();
                });
            });
        }
    }
});
```

OR

```javascript
var user = new User();

user.on('beforeUpdate', handler(callback))
```

### Transactions

```javascript

const user = new User({
    email: 'user@example.com',
    password: '12345678',
    role: 'Admin'
});

const account = new Account({
    fullname: 'Admin User',
});

User.transaction((trx) => {
    return user.transacting(trx).save().then(() => {
        account.userId = user.id;
        account.collectiveId =user.id;

        return account.transacting(trx).save();
    })
    .then(trx.commit)
    .catch(trx.rollback);
})
.then((res) => {
    // all good
    console.log('all good', res)
})
.catch((err) => {
    // error transaction rolled-back
    console.log('err', err)
    console.log(err.stack)
});

```

## TODO FOR v0.1.0

- [] ES6ify
- [] Add uuid support for ids
- [] Add Proper Documentation
- [] Add Krypton.Attachment.Base
- [] Add Kryton.Attachment.S3
