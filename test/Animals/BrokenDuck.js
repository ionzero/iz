var iz = require('../../lib/iz');
//iz.use('Animals.Duck');

module.exports = iz.Package('Animals.BrokenDuck', { extends: 'Animals.Duck' }, function (Class, SUPER) {

   // THIS FILE IS INTENTIONALLY BROKEN TO PRODUCE A SYNTAX ERROR!
   Class.has( 'quack', { default: 'Quirk'}));


   return Class;
});
