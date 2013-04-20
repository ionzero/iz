var iz = require('../lib/iz');

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

	it('without search_path file outside path is not found', function() {
		var failed = false;
		var foo;
		
		try {
			foo = iz.Use('FooClass');
			console.log(foo);
		} catch (e) {
			failed = true;
		}
		assert.equal(failed, true);
	});

	it('uses search_path properly', function() {
		var loaded = false;
		iz.add_search_path('./outside_path/');
		
		var Foo = iz.Use('FooClass');
		assert.equal(typeof Foo, 'function');
		var foo = new Foo();
		assert.equal(foo.foo(), 'foo');
	});

	
	it('using lock_search_path prevents add_search_path from adding paths', function() {
		var added = false;

		iz.lock_search_path();
		iz.Tetchy(true);
		try {
			iz.add_search_path('./somethingelse/');
			added = true;
		} catch(e) {
		}
		iz.Tetchy(false);
		assert.equal(added, false);

	});

});