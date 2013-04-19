var iz = require('../../lib/iz.js');

iz.Package('Foo', { extends: 'Animals.Duck' }, function(Class, SUPER) {

   Class.foo = function() {
	return 'foo';
   };

   return Class;
});
