var iz = require('../../lib/iz');
//iz.use('Animals.Duck');

module.exports = iz.Package('Animals.EvilDuck', { extends: 'Animals.Duck' }, function (Class, SUPER) {
   
   Class.has( 'quack', { default: 'Evil quack'}); 
   
   return Class;
});
