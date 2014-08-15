var iz = require('../lib/iz.js');
var assert = require('assert');
var util = require('util');

describe('IZ Expose:', function () {

	var Animals = undefined;

	before(function() {
		Animals = require('./Animals_index.js');
	});

	it('iz.Expose works', function() {
		assert.notEqual(Animals, undefined, "Animals is not undefined");
	});

	it('Can create objects correctly', function() {
		var duck = new Animals.Duck();
		var evil = new Animals.Duck.Evil();
		assert.equal(duck.quack(), 'quack');
		assert.equal(evil.quack(), 'Evil quack');
	});

	it('Constructors create the same type of object as iz.Module', function() {
		var evil = new Animals.Duck.Evil();
		var evil2 = new iz.Module('Animals.Duck.Evil')();

		assert.equal(evil.isa(), evil2.isa(), "ISA matches");
		assert.equal(evil.quack(), evil2.quack(), "Quacks like a...");
		assert.equal(evil.prototype, evil2.prototype, "Prototype is the same");
	});

});