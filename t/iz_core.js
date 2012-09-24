var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Core:', function () {
	
	before(function() {
		
	});
	
	describe('Base:', function() {
	
		var dostuff;
		
		it('iz.Package works', function() {

			iz.Package('do.stuff', function (root_object) {
		        var self = root_object;

				self.has('age', { builder: function(meta) { return 19; },
		                           isa: 'number' });
		
				self.has('birthdate', { isa: 'string', default: '1993-08-08'});
		        self.do_things = function() {
		            //console.log('doing_things!');
		            return 'doing things';
		        };
		        return self;
		    });
		
			var test = iz.Module('do.stuff');
			assert.equal(typeof(test), 'function');
		
		});
		
		it('can create object from package', function() {
			dostuff = new iz.Module('do.stuff')();
			assert.equal(typeof(dostuff), 'object');
		});
		
	    it("created Object contains appropriate methods", function() { 
			assert.equal(typeof(dostuff['do_things']),'function'); 
		});
	    
		it("created Object contains inherited iz methods", function() {
			assert.equal(typeof(dostuff['can']),'function');
		});
		
	    it("created Obiect doesn't contain invalid methods", function() {
			assert.notEqual(typeof(dostuff['figgle']),'function');
		});
		
		it('attribute creation with has works', function() {
			assert.equal(typeof(dostuff['age']), 'function');
			assert.notEqual(dostuff.age(), undefined);
		});
		
		it('attribute builder functions work', function() {
			assert.equal(dostuff.age(), 19);
		});
		
		it('attribute defaults work', function() {
			assert.equal(dostuff.birthdate(), '1993-08-08');
		});
		
		it('valid value passes attribute type checking', function() {
			dostuff.age(22);
		})
		
		it('invalid value fails attribute type checking', function() {
			var passed = false;
			
			// setting an invalid data type will throw an exception
			try {
				dostuff.age('bob');
			} catch(e) {
				passed = true;
			}
			assert.ok(passed);
		})
		
		it('can add attribute after object creation', function() {
			dostuff.has('other', { isa: 'string', default: 'something else'});
			assert.equal(typeof(dostuff['other']),'function')
		});
		
		it('post-new added attributes work', function() {
			assert.equal(dostuff.other(), 'something else');
		});
		
		it('post-new added attributes can be set', function() {
			dostuff.other('bob');
		    assert.equal(dostuff.other(), 'bob');
		});
		it('can add an attribute with no set type', function() {
			dostuff.has('something', { default: "it is something" });
			assert.equal(typeof(dostuff['something']),'function');
		});
	   
	  	it('default on attribute with no set type', function() {
			assert.equal(dostuff.something(),'it is something');
		});
	    
		it('default on attribute with no set type can be set to a different type', function() {
			dostuff.something(5);
			assert.equal(dostuff.something(),5);
		});
		
		it('iz.Use loads modules', function() {
			var EvilDuck = iz.Use('Animals.EvilDuck');
			var foo = new EvilDuck();
			assert.equal(typeof(foo['quack']), 'function');
			assert.equal(foo.quack(), 'Evil quack');
		});
	});
	
	// TODO: Add tests for Constructor

});
