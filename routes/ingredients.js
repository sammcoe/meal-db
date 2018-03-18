'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Ingredient = require('../models/ingredient');

const ingredients = module.context.collection('ingredients');
const keySchema = joi.string().required()
.description('The key of the ingredient');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('ingredient');


router.get(function (req, res) {
  res.send(ingredients.all());
}, 'list')
.response([Ingredient], 'A list of ingredients.')
.summary('List all ingredients')
.description(dd`
  Retrieves a list of all ingredients.
`);


router.post(function (req, res) {
  const ingredient = req.body;
  let meta;
  try {
    meta = ingredients.save(ingredient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(ingredient, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: ingredient._key})
  ));
  res.send(ingredient);
}, 'create')
.body(Ingredient, 'The ingredient to create.')
.response(201, Ingredient, 'The created ingredient.')
.error(HTTP_CONFLICT, 'The ingredient already exists.')
.summary('Create a new ingredient')
.description(dd`
  Creates a new ingredient from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let ingredient
  try {
    ingredient = ingredients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(ingredient);
}, 'detail')
.pathParam('key', keySchema)
.response(Ingredient, 'The ingredient.')
.summary('Fetch a ingredient')
.description(dd`
  Retrieves a ingredient by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const ingredient = req.body;
  let meta;
  try {
    meta = ingredients.replace(key, ingredient);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(ingredient, meta);
  res.send(ingredient);
}, 'replace')
.pathParam('key', keySchema)
.body(Ingredient, 'The data to replace the ingredient with.')
.response(Ingredient, 'The new ingredient.')
.summary('Replace a ingredient')
.description(dd`
  Replaces an existing ingredient with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let ingredient;
  try {
    ingredients.update(key, patchData);
    ingredient = ingredients.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(ingredient);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the ingredient with.'))
.response(Ingredient, 'The updated ingredient.')
.summary('Update a ingredient')
.description(dd`
  Patches a ingredient with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    ingredients.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a ingredient')
.description(dd`
  Deletes a ingredient from the database.
`);
