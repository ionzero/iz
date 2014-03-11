var iz = require('../iz.js');
//iz.use('Animals.Duck');

module.exports = iz.Package('Animals.GoodDuck', function (Class, SUPER) {
   
   Class.has( 'quack', { default: 'I brought you a coffee.'}); 
   
   return Class;
});
