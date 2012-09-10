var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Core:', function () {
	
	before(function() {
		

	});

	describe('Mixin based inheritence:', function() {

		iz.Package('do.stuff', function (root_object) {
	        var self = root_object;

	        self.do_things = function() {
	            //console.log('doing_things!');
	            return 'doing things';
	        };
	        return self;
	    });
	
		iz.Package('do.more', { extends: 'do.stuff' }, function (root_object) {
	        var self = root_object;
	        self.has('name', { builder: function(meta) { return 'william'; },
	                           isa: 'string' });

	        self.do_more = function() {
	            //console.log('doing more for ' + this.name());
	            return('doing more');
	        };
	        return self;
	    });
	
		iz.Package('do.other', { mixin: 'do.more' }, function (root_object) {
	        var self = root_object;
	        self.has({ num: { isa: 'number', 'default': 22} });
	        self.do_other = function() {
	            console.log('doing other!');
	            return('doing other');
	        };
	        return self;
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
		

		
		it('testdescription', function() {
			
		});
		
		it('testdescription', function() {
			
		});
		
		it('testdescription', function() {
			
		});
		
		it('testdescription', function() {
			
		});
	});
});
