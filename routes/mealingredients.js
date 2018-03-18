'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const MealIngredient = require('../models/mealingredient');

const mealIngredients = module.context.collection('mealIngredients');
const keySchema = joi.string().required()
.description('The key of the mealIngredient');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('mealIngredient');


const NewMealIngredient = Object.assign({}, MealIngredient, {
  schema: Object.assign({}, MealIngredient.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(mealIngredients.all());
}, 'list')
.response([MealIngredient], 'A list of mealIngredients.')
.summary('List all mealIngredients')
.description(dd`
  Retrieves a list of all mealIngredients.
`);


router.post(function (req, res) {
  const mealIngredient = req.body;
  let meta;
  try {
    meta = mealIngredients.save(mealIngredient._from, mealIngredient._to, mealIngredient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(mealIngredient, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: mealIngredient._key})
  ));
  res.send(mealIngredient);
}, 'create')
.body(NewMealIngredient, 'The mealIngredient to create.')
.response(201, MealIngredient, 'The created mealIngredient.')
.error(HTTP_CONFLICT, 'The mealIngredient already exists.')
.summary('Create a new mealIngredient')
.description(dd`
  Creates a new mealIngredient from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let mealIngredient
  try {
    mealIngredient = mealIngredients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(mealIngredient);
}, 'detail')
.pathParam('key', keySchema)
.response(MealIngredient, 'The mealIngredient.')
.summary('Fetch a mealIngredient')
.description(dd`
  Retrieves a mealIngredient by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const mealIngredient = req.body;
  let meta;
  try {
    meta = mealIngredients.replace(key, mealIngredient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(mealIngredient, meta);
  res.send(mealIngredient);
}, 'replace')
.pathParam('key', keySchema)
.body(MealIngredient, 'The data to replace the mealIngredient with.')
.response(MealIngredient, 'The new mealIngredient.')
.summary('Replace a mealIngredient')
.description(dd`
  Replaces an existing mealIngredient with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let mealIngredient;
  try {
    mealIngredients.update(key, patchData);
    mealIngredient = mealIngredients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(mealIngredient);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the mealIngredient with.'))
.response(MealIngredient, 'The updated mealIngredient.')
.summary('Update a mealIngredient')
.description(dd`
  Patches a mealIngredient with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    mealIngredients.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a mealIngredient')
.description(dd`
  Deletes a mealIngredient from the database.
`);
