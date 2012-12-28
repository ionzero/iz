var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Core:', function () {
    
    var base_object = {
        age: 11,
        get_age: function() {
            return this.age; 
        },
        square_age: function() {
            return this.age * this.age;
        }
    };
	
	iz.Package('do.stuff', {extends: base_object }, function (self) {

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
    
	before(function() {

	});
	
	describe('Object based Inheritance:', function() {
		

	    
	    var subclass = new iz.Module('do.stuff')();
	    
	    it('iz class methods are visible', function() {
			assert.equal(typeof(subclass['do_things']), 'function');
		});
		
		it('base class attributes are visible', function() {
		    assert.equal(typeof(subclass['get_age']), 'function');
		    assert.equal(subclass.get_age(), 11);
		    subclass.age = 12;
		    assert.equal(subclass.get_age(), 12);
		    assert.equal(subclass.square_age(), 144);
            
		});
	});
	
	describe('IZ based subclass of object subclass', function() {
	    
	    var domore = new iz.Module('do.more')();
	    
	    it('base class attributes are visible', function() {
    		    assert.equal(typeof(domore['get_age']), 'function');
    		    assert.equal(domore.get_age(), 11);
    		    domore.age = 12;
    		    assert.equal(domore.get_age(), 12);
    		    assert.equal(domore.square_age(), 144);
    	});
    
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
	
	
});
