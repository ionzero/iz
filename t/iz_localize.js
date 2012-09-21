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
		});
		
		it('deleting items in localized copy leaves original alone', function() {
			var localized_obj = iz.localize(original);
			
			delete localized_obj.address['number'];
			assert.equal(original.address.number, 123);
		});


	});
	
});