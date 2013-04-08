var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Debug:', function () {
	
	before(function() {
		

	});

	describe('Object Tagging:', function() {

        
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
	        return Class;
	    });
	    
	    it('New objects created when tagging disabled have no tags', function () {
	        iz.object_tagging(false);
	        var foo = new iz.Module('do.more')();
	        assert.equal(foo.get_iz_object_tag(), undefined);
	    });
	    
	    it('New objects created when tagging enabled have tags', function () {
	        iz.object_tagging(true);
	        var foo = new iz.Module('do.more')();
	        assert.notEqual(foo.get_iz_object_tag(), undefined);
	    });
	    
	    it('New objects get a tag if we call get_iz_object_tag(true)', function () {
	        var foo = new iz.Module('do.more')();
	        assert.notEqual(foo.get_iz_object_tag(), undefined);
	    });
	    
	    it('objects created when tagging enabled have tags, even if tagging is disabled later', function () {
	        iz.object_tagging(true);
	        var foo = new iz.Module('do.more')();
	        iz.object_tagging(false);
	        assert.notEqual(foo.get_iz_object_tag(), undefined);
	        //console.log(foo.get_iz_object_tag());
	    });
	    
	});
	
	describe('Object Tagging:', function() {

        
		iz.Package('do.things', function (Class, SUPER) {

            Class.has('counter', { isa: 'number', default: 0 });
	        Class.do_things = function() {
	            //console.log('doing_things!');
	            return 'doing things';
	        };
	        
	        Class.bump = function() {
	            var counter = this.counter() + 1;
	            return this.counter(counter);
	        }
	        
	        return Class;
	    });

	    
	    it('bound callbacks debug when debugging is enabled', function() {
	        iz.object_tagging(false);
	        var debug_data = new Array();
    	    var debug_func = function(message) {
    	        debug_data.push(message);
    	    };
	        // set auto_debug's debug function to put messages in our array
	        iz.auto_debug(debug_func);
	        
	        var dothings = new iz.Module('do.things')();
	        
	        var bound_callback = dothings.bind_cb('bound_callback', function() {
	            this.bump();
	        });
	        
	        bound_callback();
	        assert.equal(debug_data[0], 'function bound_callback called');
	        
	    });
	    
	    it('bound callbacks include tag when available', function() {
	        iz.object_tagging(false);
	        var debug_data = new Array();
    	    var debug_func = function(message) {
    	        debug_data.push(message);
    	    };
	        // set auto_debug's debug function to put messages in our array
	        iz.auto_debug(debug_func);
	        
	        var dothings = new iz.Module('do.things')();
	        // force creation of an object tag.
	        var tag = dothings.get_iz_object_tag(true);
	        assert.notEqual(tag.length, 0);
	        
	        var bound_callback = dothings.bind_cb('tagged_callback', function() {
	            return this.bump();
	        });
	        
	        bound_callback();
	        
	        assert.equal(debug_data[0], 'function tagged_callback called for object ' + tag);
	        
	    });
	});
});
	