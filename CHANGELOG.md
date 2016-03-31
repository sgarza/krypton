## 2016-03-30, Version 0.0.14
- Krypton.Relation will check models super tree for Krypton.Model


## 2016-03-15, Version 0.0.13
- Fixed a typo in Model.destroy()

## 2016-02-22, Version 0.0.12
- Add {after, before} destroy hooks
- Improve Invalid Hook Error Message
- Fix typos
- Add support for knex .pluck()
- Refactot hooks to ditch Promise.defer
- Refactor Error Handling
- HasOne Relation now returns null in there are no results

## 2016-02-22, Version 0.0.11
- Add .toSQL() support and optimize HasManyThrough relation
- Add Istanbul to package.json dev dependencies, This is so you can run `npm run test` without having to have had installed instanbul globally.
- Variable name refactor in QueryBuilder

## 2016-02-17, Version 0.0.10
- Add missing .as Knex method
- Fix bug where false attributes were turning into null

## 2016-02-09, Version 0.0.9
- Fix a lodash deprecated method

## 2016-02-09, Version 0.0.8
- Fix race condition in HasManyThrough

## 2016-02-01, Version 0.0.7
- Fix eagerFetcher recursive iteration loop

## 2016-02-01, Version 0.0.6
- Fix record context in QueryBuilder eagerFetcher

## 2016-01-06, Version 0.0.5
 - Add the ability to dynamically set a knex instance to Krypton.Model SubClases
  and to Krypton.Model instances

## 2015-11-17, Version 0.0.4
 - Clean-up code

## 2015-11-17, Version 0.0.3
 - Add ActiveRecord style callbacks (See README);

## 2015-10-05, Version 0.0.2
 - Use an Model attributes Array instead of an Object
