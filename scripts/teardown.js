'use strict';
const db = require('@arangodb').db;
const collections = [
  "users",
  "meals",
  "ingredients",
  "userMeals",
  "mealIngredients"
];

for (const localName of collections) {
  const qualifiedName = module.context.collectionName(localName);
  db._drop(qualifiedName);
}
