var iz = require('../../lib/iz.js');

iz.Package('FooClass', { extends: 'Animals.Duck' }, function(Class, SUPER) {

   Class.foo = function() {
	return 'foo';
   };

   return Class;
});
