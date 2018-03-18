'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const UserMeal = require('../models/usermeal');

const userMeals = module.context.collection('userMeals');
const keySchema = joi.string().required()
.description('The key of the userMeal');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('userMeal');


const NewUserMeal = Object.assign({}, UserMeal, {
  schema: Object.assign({}, UserMeal.schema, {
    _from: joi.string(),
    _to: joi.string()
  })
});


router.get(function (req, res) {
  res.send(userMeals.all());
}, 'list')
.response([UserMeal], 'A list of userMeals.')
.summary('List all userMeals')
.description(dd`
  Retrieves a list of all userMeals.
`);


router.post(function (req, res) {
  const userMeal = req.body;
  let meta;
  try {
    meta = userMeals.save(userMeal._from, userMeal._to, userMeal);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(userMeal, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: userMeal._key})
  ));
  res.send(userMeal);
}, 'create')
.body(NewUserMeal, 'The userMeal to create.')
.response(201, UserMeal, 'The created userMeal.')
.error(HTTP_CONFLICT, 'The userMeal already exists.')
.summary('Create a new userMeal')
.description(dd`
  Creates a new userMeal from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let userMeal
  try {
    userMeal = userMeals.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(userMeal);
}, 'detail')
.pathParam('key', keySchema)
.response(UserMeal, 'The userMeal.')
.summary('Fetch a userMeal')
.description(dd`
  Retrieves a userMeal by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const userMeal = req.body;
  let meta;
  try {
    meta = userMeals.replace(key, userMeal);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(userMeal, meta);
  res.send(userMeal);
}, 'replace')
.pathParam('key', keySchema)
.body(UserMeal, 'The data to replace the userMeal with.')
.response(UserMeal, 'The new userMeal.')
.summary('Replace a userMeal')
.description(dd`
  Replaces an existing userMeal with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let userMeal;
  try {
    userMeals.update(key, patchData);
    userMeal = userMeals.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(userMeal);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the userMeal with.'))
.response(UserMeal, 'The updated userMeal.')
.summary('Update a userMeal')
.description(dd`
  Patches a userMeal with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    userMeals.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a userMeal')
.description(dd`
  Deletes a userMeal from the database.
`);
