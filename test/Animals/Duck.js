var iz = require('../../lib/iz');

module.exports = iz.Package('Animals.Duck', function (Class, SUPER) {
   Class.has( 'quack', { default: 'quack'}); 
   return Class;
});
