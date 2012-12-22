var iz = require('iz');
var assert = require('assert');
var util = require('util');

describe('IZ Localization:', function () {
	
	before(function() {
		
	});
	
	describe('Standard Objects:', function() {

		var original = {
			name: 'foo',
			age: 18,
			address: {
					number: 123,
					street: 'Main St',
					city: 'Chicago',
					state: 'Illinois',
					zip: '60609'
				 }

		};
		
		it('can localize', function() {
			var localized_obj = iz.localize(original);	
		});
		
		it('localization of regular objects fools deepEqual', function() {
            var localized_obj = iz.localize(original);
            assert.deepEqual(original, localized_obj); 
        });
        
		it('allows access to sub-items in both original and localized', function() {
			var localized_obj = iz.localize(original);
			
			
			assert.equal(original.name, 'foo');
			assert.equal(original.address.zip, '60609');
			assert.equal(localized_obj.name, original.name);
			assert.equal(localized_obj.address.zip, original.address.zip);
		})
		
		it('changing localized elements leaves original alone', function() {
			var localized_obj = iz.localize(original);
			
			localized_obj.name = 'bar';
			assert.equal(original.name, 'foo');
			assert.equal(localized_obj.name, 'bar');
		});
		
		it('changing localized elements leaves neighbor elements alone', function() {
			var localized_obj = iz.localize(original);
			
			localized_obj.name = 'bar';
			assert.equal(localized_obj.age, 18);
			assert.equal(localized_obj.address.zip, '60609');
			//console.log(util.inspect(localized_obj._get_only_localized_data()));
		});
		
		it('able to change elements deep in hierarchy', function() {
			var localized_obj = iz.localize(original);
			
			localized_obj.address.number = 992;
			assert.equal(original.address.number, 123);
			assert.equal(localized_obj.address.number, 992);
		});
		
		it('deleting items in localized copy works', function() {
			var localized_obj = iz.localize(original);
			
			delete localized_obj.address['number'];

			assert.equal(typeof(localized_obj.address['number']), 'undefined');
			assert.equal(localized_obj.address.hasOwnProperty('number'), false);
			
		});
		
		it('deleting items in localized copy leaves original alone', function() {
			var localized_obj = iz.localize(original);
			
			delete localized_obj.address['number'];
		    assert.equal(original.address.number, 123);
		});
		
		it('undefined items in localized are not mistaken for deleted items', function() {
			var localized_obj = iz.localize(original);
			
			localized_obj.address['number'] = undefined;

			assert.equal(localized_obj.address.hasOwnProperty('number'), true);
		});

        it("able to accurately determine what's different in the localized copy", function() {
			var localized_obj = iz.localize(original);
			
			localized_obj.address.number = 992;
			assert.equal(original.address.number, 123);
			assert.deepEqual(iz.get_localized_changes(localized_obj), { address: { number: 992}});
		});
	});
	
	
	describe('IZ-based Objects:', function() {

    	before(function() {

        	iz.Package('do.stuff', function (root_object) {
                var self = root_object;

        		self.has('age', { builder: function(meta) { return 19; },
                                   isa: 'number' });

        		self.has('birthdate', { isa: 'string', default: '1993-08-08'});
        		self.has('address', { isa: 'object'});
                self.do_things = function() {
                    //console.log('doing_things!');
                    return 'doing things';
                };
                return self;
            });

    	});    

        it('creating a localized object works', function() {
            var original = new iz.Module('do.stuff')();
        
            original.age(22);
            var localized = iz.localize(original);
            
            assert.equal(original.age(), localized.age());
        });
        
        it('changing localized object leaves original untouched', function() {
            var original = new iz.Module('do.stuff')();
        
            original.age(22);
            var localized = iz.localize(original);
            localized.age(25)
            
            assert.notEqual(original.age(), localized.age());
            assert.equal(localized.age(), 25);
        });
        
		it('changing localized elements leaves neighbor elements alone', function() {
            var original = new iz.Module('do.stuff')();
        
            original.age(22);
            var localized = iz.localize(original);
            localized.age(25)
            
            assert.notEqual(original.age(), localized.age());
            assert.equal(localized.age(), 25);
            assert.equal(original.birthdate(), localized.birthdate());
        });
        
        it('changing original object shows through to localized copy', function() {
            var original = new iz.Module('do.stuff')();
        
            original.age(22);
            var localized = iz.localize(original);
            
            assert.equal(localized.age(), 22);
            
            original.age(39);
            
            assert.equal(original.age(), localized.age());
            assert.equal(localized.age(), 39);
        });
        
        it('class membership is correct on localized copy', function() {
            var original = new iz.Module('do.stuff')();
        
            var localized = iz.localize(original);
            assert.ok(localized.isa('do.stuff'));
        });
        
        it('can behaves properly on localized copy', function() {
            var original = new iz.Module('do.stuff')();
        
            var localized = iz.localize(original);
            assert.ok(localized.can('do_things'));
        });
        
        it('obtaining default on localized does not trigger default on original', function() {
            var original = new iz.Module('do.stuff')();
            var localized = iz.localize(original);
            var foo = localized.age();
            
            assert.equal(localized.age(), 19);
            assert.equal(localized._has_been_set('age'),true);
            
            assert.equal(original._has_been_set('age'),false);
            //console.log(util.inspect(localized._get_only_localized_data()));
            
        });
        
        it('sub-objects are localized', function() {
            var original = new iz.Module('do.stuff')();
            original.address({ street: 'Main', number: 123});
            var localized = iz.localize(original);
            
            assert.equal(localized.address().number, original.address().number);
        });
        
        it('changes to sub-objects are localized', function() {
            var original = new iz.Module('do.stuff')();
            original.address({ street: 'Main', number: 123});
            var localized = iz.localize(original);
            
            localized.address().number = 116;
            assert.equal(original.address().number, 123);
            assert.notEqual(localized.address().number, original.address().number);
        });
        

        it("able to accurately determine what's different in the localized copy", function() {

            var original = new iz.Module('do.stuff')();
            original.address({ street: 'Main', number: 123});
            var localized = iz.localize(original);
            
            localized.address().number = 116;
            assert.deepEqual(iz.get_localized_changes(localized), { address: { number: 116 }});
        });
        
        
        
        it('Able to localize a subclass', function() {
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
    	    var original = new iz.Module('do.more')();
    	    
    	    var localized = iz.localize(original);
    	    
    	    original.age(100);
    	    assert.equal(original.age(), localized.age());
    	    assert.equal(original.name(), localized.name());
    	    localized.name('bob');
    	    assert.notEqual(original.name(), localized.name());
    	    
        });
    });
});