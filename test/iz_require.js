var iz = require('../lib/iz');
var assert = require('assert');
var util = require('util');
var EvilDuck = require('./Animals/EvilDuck');

describe('IZ Require compatibility:', function () {
	
	before(function() {
		
	});

	it('require loads iz module properly', function() {
		//var EvilDuck = iz.Module('Animals.EvilDuck');
		var foo = new EvilDuck();
		assert.equal(typeof(foo['quack']), 'function');
		assert.equal(foo.quack(), 'Evil quack');
	});

});
