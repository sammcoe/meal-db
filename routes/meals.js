'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Meal = require('../models/meal');

const meals = module.context.collection('meals');
const keySchema = joi.string().required()
.description('The key of the meal');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('meal');


router.get(function (req, res) {
  res.send(meals.all());
}, 'list')
.response([Meal], 'A list of meals.')
.summary('List all meals')
.description(dd`
  Retrieves a list of all meals.
`);


router.post(function (req, res) {
  const meal = req.body;
  let meta;
  try {
    meta = meals.save(meal);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(meal, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: meal._key})
  ));
  res.send(meal);
}, 'create')
.body(Meal, 'The meal to create.')
.response(201, Meal, 'The created meal.')
.error(HTTP_CONFLICT, 'The meal already exists.')
.summary('Create a new meal')
.description(dd`
  Creates a new meal from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let meal
  try {
    meal = meals.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(meal);
}, 'detail')
.pathParam('key', keySchema)
.response(Meal, 'The meal.')
.summary('Fetch a meal')
.description(dd`
  Retrieves a meal by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const meal = req.body;
  let meta;
  try {
    meta = meals.replace(key, meal);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(meal, meta);
  res.send(meal);
}, 'replace')
.pathParam('key', keySchema)
.body(Meal, 'The data to replace the meal with.')
.response(Meal, 'The new meal.')
.summary('Replace a meal')
.description(dd`
  Replaces an existing meal with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let meal;
  try {
    meals.update(key, patchData);
    meal = meals.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(meal);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the meal with.'))
.response(Meal, 'The updated meal.')
.summary('Update a meal')
.description(dd`
  Patches a meal with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    meals.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a meal')
.description(dd`
  Deletes a meal from the database.
`);
