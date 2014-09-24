var iz = require('../../../lib/iz');
//iz.use('Animals.Duck');

module.exports = iz.Package('Animals.Duck.Evil', { extends: 'Animals.Duck' }, function (Class, SUPER) {
   
   Class.has( 'quack', { default: 'Evil quack'}); 
   
   return Class;
});
