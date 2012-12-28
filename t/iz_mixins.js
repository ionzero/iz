var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Core:', function () {
	
	before(function() {
		

	});

	describe('Mixin based inheritence:', function() {

		iz.Package('do.stuff', function (Class) {

	        Class.do_things = function() {
	            //console.log('doing_things!');
	            return 'doing things';
	        };
	        return Class;
	    });
	
		iz.Package('do.more', { extends: 'do.stuff' }, function (Class) {
	        Class.has('name', { builder: function(meta) { return 'william'; },
	                           isa: 'string' });

	        Class.do_more = function() {
	            //console.log('doing more for ' + this.name());
	            return('doing more');
	        };
	        return Class;
	    });
	
		iz.Package('do.other', { mixin: 'do.more' }, function (Class) {
	        Class.has({ num: { isa: 'number', 'default': 22} });
	        Class.do_other = function() {
	            console.log('doing other!');
	            return('doing other');
	        };
	        return Class;
	    });
	
	
	    var doother = new iz.Module('do.other')();
		
		it('iz.mixin extends object', function() {
			assert.equal(typeof(doother['do_more']),'function');
		});
		
		it('iz.can recognizes mixin-derived functions', function() {
			assert.ok(doother.can('name'));
		});
		
		it('iz.mixin accessors are accessible', function() {
			assert.equal(doother.name(),'william');
			
		});


		
		it('overriding mixin-derived methods post-mixin works', function() {
			doother.do_more = function() {
				return 'I am doing more';
			};
			assert.equal(doother.do_more(), 'I am doing more');
		});
		
	});
	
	describe('Raw Object based mixin:', function() {
		var bob = {
			foo: 26,
			bar: 100,
			do_regular: function() {
				return 'doing regular stuff';
			}
		};
		
		iz.Package('extendaregular', {mixin: bob}, function(root_object) { 
			var Class = root_object;
			Class.has('something', { isa: 'string', builder: function(meta) { return 'in the way she moves'; }});
			Class.do_somethingelse = function() {
				return "breaking the speed of the sound of loneliness";
			};
			return Class;
		});
	
		var ex = new iz.Module('extendaregular')();
		it('can extend a regular object', function() {
			assert.equal(typeof(ex.foo), 'number');
			assert.equal(typeof(ex.something), 'function');
			assert.equal(typeof(ex.do_regular), 'function');
			
		});
		it('can access original elements', function() {
			assert.equal(ex.foo, 26);
			assert.equal(ex.do_regular(), 'doing regular stuff');
		});
		it('can access subclass elements', function() {
			assert.equal(ex.something(), 'in the way she moves');
			assert.equal(ex.do_somethingelse(), 'breaking the speed of the sound of loneliness');
		});
		it('can modify subclass attributes without affecting original', function() {
			ex.foo = 99;
			assert.equal(bob.foo, 26);
			assert.equal(ex.foo, 99);
		})
	});
});
