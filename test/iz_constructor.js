var iz = require('../lib/iz');
var assert = require('assert');
var util = require('util');

describe('IZ Constructors:', function () {
	
	iz.Package('WithConstructor', function (Class, SUPER) {
        
		Class.has('age', {  builder: function(meta) { return 19; },
                           isa: 'number' });
        
        Class.has('weight', { builder: function() {return 160; },
         					 isa: 'number' });		
         					 		
        Class.CONSTRUCT = function(args, object_to_localize) {
            if (args['age']) {
                this.age(args['age']);
            };
            if (args['weight_in_kilos']) {
                this.weight(args['weight_in_kilos'] * 2.2);
            }
            return this;
        };
        
		// this doesn't get run, because we didn't call it from our CONSTRUCT routine
		Class._on_object_create = function(args) {
		    this._secret = {}
		    this._secret.args = args;
		};
		
        return Class;
    });
    
    iz.Package('WithConstructorSuper', function (Class, SUPER) {
        
		Class.has('age', {  builder: function(meta) { return 19; },
                           isa: 'number' });
        
        Class.has('weight', { builder: function() {return 160; },
         					 isa: 'number' });		
         					 		
        Class.CONSTRUCT = function(args, object_to_localize) {
            
            var newthis = this.SUPER('CONSTRUCT')(args, object_to_localize);
            
            if (args['weight_in_kilos']) {
                newthis.weight(args['weight_in_kilos'] * 2.2);
            }
            
            return newthis;
        };
        
		// this doesn't get run, because we didn't call it from our CONSTRUCT routine
		Class._on_object_create = function(args) {
		    this._secret = {}
		    this._secret.args = args;
		};
		
        return Class;
    });
    
    iz.Package('SubConstructor', { extends: 'WithConstructor' }, function (Class, SUPER) {
        
        Class.has('haircolor', { isa: 'string', default: 'purple'});
        
		// this doesn't get run, because we didn't call it from our CONSTRUCT routine
		Class._on_object_create = function(args) {
		    this._secret = {}
		    this._secret.args = args;
		};
		
        return Class;
    });
	
	iz.Package('WithCreator', function (Class, SUPER) {
        
		Class.has('age', {  builder: function(meta) { return 19; },
                           isa: 'number' });
        
        Class.has('weight', { readonly:true, builder: function() {return 160; },
         					 isa: 'number' });		
         					 		
		Class._on_object_create = function(args) {
		    this._secret = {}
		    this._secret.args = args;
		};
		
        return Class;
    });
    
    iz.Package('SubWithCreator', { extends: 'WithCreator'}, function (Class, SUPER) {
    	Class.has('name', { isa: 'string', default: 'bill'});

    	return Class;
    });

    iz.Package('SubSubWithCreator', { extends: 'SubWithCreator'}, function (Class, SUPER) {

    	Class._on_object_create = function(args) {
    		this.SUPER('_on_object_create')(args);
    		this.name('William');
    	}
    	return Class;
    });

    
	before(function() {
		
	});
	
	describe('Overriding CONSTRUCT:', function() {
		
		it('Basic overriding with arguments works', function() {

			var wc = new iz.Module('WithConstructor')({ age: 27, weight_in_kilos: 79 });
			
			assert.equal(wc.age(), 27);
			assert.equal(wc.weight(), 173.8);
		});
				
		it('_on_object_create is not run', function() {
		    
		    var wc = new iz.Module('WithConstructor')({ age: 127, weight: 175 });
		    
			assert.equal(typeof wc._secret, 'undefined');
		});
		
		it("arguments not handled in overridden CONSTRUCT aren't set", function() {
		    
			var wc = new iz.Module('WithConstructor')({ age: 27, weight: 200 });
			
			assert.equal(wc.age(), 27);
			assert.notEqual(wc.weight(), 200);		
		});
	});
	
	describe('Subclass:', function() {
		
		it('Inherits CONSTRUCT', function() {
			var wc = new iz.Module('SubConstructor')({ age: 22, weight_in_kilos: 80 });
			assert.equal(wc.age(), 22);
			assert.equal(wc.weight(), 176);
		});
		
		it("arguments not handled in parent CONSTRUCT aren't set", function() {
		    
			var wc = new iz.Module('WithConstructor')({ age: 23, weight: 210 });
			
			assert.equal(wc.age(), 23);
			assert.notEqual(wc.weight(), 210);		
		});
		
		it('_on_object_create is still not run', function() {
		    var wc = new iz.Module('SubConstructor')({ age: 27, weight: 175 });
			
			assert.equal(typeof wc._secret, 'undefined');
		});
	});

	
	describe('Initializers using _on_object_create:', function() {
		
		it('args are set properly', function() {

			var wc = new iz.Module('WithCreator')({ age: 27, weight: 175 });
			assert.equal(wc.age(), 27);
			assert.equal(wc.weight(), 175);
	
		});
		
		it('_on_object_create runs', function() {
		    var wc = new iz.Module('WithCreator')({ age: 27, weight: 175 });
			
			assert.equal(wc._secret.args.age, 27);
			assert.equal(wc._secret.args.weight, 175);
		});
	});
	
	describe('Initializers using superclass _on_object_create:', function() {
		
		it('args are set properly', function() {

			var wc = new iz.Module('SubWithCreator')({ age: 27, weight: 175 });
			assert.equal(wc.age(), 27);
			assert.equal(wc.weight(), 175);
	
		});
		
		it("parent _on_object_create runs when we don't have one", function() {
		    var wc = new iz.Module('SubWithCreator')({ age: 27, weight: 175 });
			
			assert.equal(wc._secret.args.age, 27);
			assert.equal(wc._secret.args.weight, 175);
		});

		it("both our _on_object_create and our parent's runs when we have our own _on_object_create", function() {
		    var wc = new iz.Module('SubSubWithCreator')({ age: 27, weight: 175 });
			
			assert.equal(wc.name(), 'William');
			assert.equal(wc._secret.args.age, 27);
			assert.equal(wc._secret.args.weight, 175);
		});
	});

	describe('Overriding CONSTRUCT, using super CONSTRUCT:', function() {
		
		it('Basic overriding with arguments works', function() {

			var wc = new iz.Module('WithConstructorSuper')({ age: 27, weight_in_kilos: 79 });
			
			assert.equal(wc.age(), 27);
			assert.equal(wc.weight(), 173.8);
		});
		
		it("arguments not handled in overridden CONSTRUCT are set", function() {
		    
			var wc = new iz.Module('WithConstructorSuper')({ age: 27, weight: 200 });
			
			assert.equal(wc.age(), 27);
			assert.equal(wc.weight(), 200);		
		});
		
		it('_on_object_create is run', function() {
		    
		    var wc = new iz.Module('WithConstructorSuper')({ age: 27, weight: 175 });
		    
			assert.equal(wc._secret.args.age, 27);
			assert.equal(wc._secret.args.weight, 175);			
		});
	});
});