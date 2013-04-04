var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Core:', function () {
	
	before(function() {

	});
	
	describe('Class based Inheritance:', function() {
		
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
	        Class.whoami = function() {
	        	return 'do.more';
	        }
	        return Class;
	    });
	
		iz.Package('do.super', { extends: 'do.more'}, function(Class) {

			var parent = Class.get_super;
			Class.whoami = function() {
				return 'do.super child of ' + parent('whoami')();
			}

			return Class;
		});

		iz.Package('do.supersuper', { extends: 'do.super'}, function(Class, get_super) {

			//console.log(typeof p);
			//var parent = p; //Class.super;

			Class.whoami = function() {
				return 'do.supersuper child of ' + get_super('whoami')();
			}

			return Class;
		});		

		var domore = new iz.Module('do.more')();
	    
	    it('iz.extends superclass methods are visible', function() {
			assert.equal(typeof(domore['do_things']), 'function');
		});
		
		it('iz.extends superclass methods are callable', function() {
			assert.equal(domore.do_things(), 'doing things');
		});
		
		it('object.can() can see methods from superclasses', function() {
			assert.ok(domore.can('do_things'));
		});
		
		it('subclass methods can override superclass', function() {
			domore['do_things'] = function() { return 'other stuff'; };
			assert.equal(domore.do_things(), 'other stuff');			
		});
		
		it('access to super from subclass works', function() {
			assert.equal(domore.get_super('do_things')(),'doing things');
		});
	});
	
	// TODO: Add tests for Constructor from superclass
	describe('Superclass behavior:', function() {
		var dosuper = new iz.Module('do.super')();
		var dosupsup = new iz.Module('do.supersuper')();


		it('super(methodname) retrieves a method', function() {
			assert.equal(typeof dosuper.get_super('whoami'), 'function');
		});

		it('using super(methodname) retrieves the correct method', function() {
			assert.equal(dosuper.get_super('whoami')(), 'do.more');
		});

		it('using super() retrieves the parent object', function() {
			assert.equal(dosuper.get_super().isa(), 'do.more');
		});

		it('multi-level super works', function() {
			assert.equal(dosupsup.whoami(), 'do.supersuper child of do.super child of do.more');
		});

		it('super calls in methods work even when calling first super() in anonymous function', function() {
			assert.equal(dosupsup.get_super('whoami')(), 'do.super child of do.more');
		});
	});

});
