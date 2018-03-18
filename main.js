'use strict';

module.context.use('/users', require('./routes/users'), 'users');
module.context.use('/meals', require('./routes/meals'), 'meals');
module.context.use('/ingredients', require('./routes/ingredients'), 'ingredients');
module.context.use('/usermeals', require('./routes/usermeals'), 'usermeals');
module.context.use('/mealingredients', require('./routes/mealingredients'), 'mealingredients');
