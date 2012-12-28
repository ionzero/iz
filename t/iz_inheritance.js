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
			assert.equal(domore.super('do_things')(),'doing things');
		});
	});
	
	// TODO: Add tests for Constructor from superclass
	

});
