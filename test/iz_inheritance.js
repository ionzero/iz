var iz = require('../lib/iz');
var assert = require('assert');
var util = require('util');

"use strict";
describe('IZ Inheritance:', function () {
	
	before(function() {

	});
	
	describe('Class based Inheritance:', function() {
		
		iz.Package('do.stuff', function (Class, SUPER) {

	        Class.do_things = function() {
	            //console.log('doing_things!');
	            return 'doing things';
	        };
	        return Class;
	    });
		
		iz.Package('do.more', { extends: 'do.stuff' }, function (Class, SUPER) {
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
	
		iz.Package('do.super', { extends: 'do.more'}, function(Class, SUPER) {

			Class.whoami = function() {
				console.log(util.inspect(this));
				return 'do.super child of ' + SUPER(this, 'whoami')() + " :" + this.name();
			}

			return Class;
		});

		iz.Package('do.supersuper', { extends: 'do.super'}, function(Class, SUPER) {

			//console.log(typeof p);
			//var SUPER = p; //Class.super;

			Class.whoami = function() {
				return 'do.supersuper child of ' + SUPER(this,'whoami')();
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
			assert.equal(domore.SUPER('do_things')(),'doing things');
		});
	});
	
	// TODO: Add tests for Constructor from superclass
	describe('Superclass behavior:', function() {
		var dosuper = new iz.Module('do.super')();
		var dosupsup = new iz.Module('do.supersuper')();


		it('obj.SUPER(methodname) retrieves a method', function() {
			assert.equal(typeof dosuper.SUPER('whoami'), 'function');
		});

		it('using obj.SUPER(methodname) retrieves the correct method', function() {
			assert.equal(dosuper.SUPER('whoami')(), 'do.more');
		});

		it('using this.SUPER() retrieves the Superclass base object', function() {
			assert.equal(dosuper.SUPER().isa(), 'do.more');
		});

		it('multi-level SUPER works', function() {
			assert.equal(dosupsup.whoami(), 'do.supersuper child of do.super child of do.more :william');
		});

		it('SUPER calls in methods work even when calling first super() in anonymous function', function() {
			assert.equal(dosupsup.SUPER('whoami')(), 'do.super child of do.more :william');
		});
	});

});
