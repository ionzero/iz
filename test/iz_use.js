var iz = require('iz');

var assert = require('assert');
var util = require('util');

describe('IZ Use compatibility:', function () {
	
	before(function() {
		
	});

	it('iz.Use calls callback properly', function(done) {
		var callback_called = false;
		this.timeout(500);
		setTimeout(function() { 
			assert.equal(callback_called, true); 
			
		}, 400);

		var EvilDuck = iz.Use('Animals.EvilDuck', function() {
			callback_called = true;
			done();
		});
	});

	it('iz.Use called again calls callback', function(done2) {
		var callback_called2 = false;
		this.timeout(500);
		setTimeout(function() { 
			assert.equal(callback_called2, true); 
		}, 400);
		var EvilDuck2 = iz.Use('Animals.EvilDuck', function() {
			callback_called2 = true;
			done2();
		});
	});

});