var util = require('util');
var fs = require('fs');
var iz, iz2;

var assert = require('assert');
var util = require('util');

describe('IZ global Prototypes:', function () {

	before(function() {
		iz = require('../lib/iz.js');
		fs.linkSync(__dirname + '/../lib/iz.js', __dirname + '/iz.js');
		iz2 = require('./iz.js');
	});

	after(function() {
		fs.unlink(__dirname + '/iz.js');
	})

	it('loaded copies of iz are not the same object', function() {
		//console.log("Survey Says: " + iz === iz2 );
		assert.notStrictEqual(iz, iz2);
	});

	it("Loading package in one iz doesn't effect the other", function() {
		var failed1 = false;
		var failed2 = false;
		iz.Use('Animals.EvilDuck');
		
		var evil = iz.Module('Animals.EvilDuck');

		assert.ok(typeof evil === 'function');
		try {
			iz2.Module('Animals.EvilDuck');
		} catch (e) {
			failed1 = true;
		};
		assert.ok(failed1);

		iz2.Use('Animals.GoodDuck');
		var good = iz2.Module('Animals.GoodDuck');
		assert.ok(typeof good === 'function');
		try {
			iz.Module('Animals.GoodDuck');
		} catch (e) {
			failed2 = true;
		};
		assert.ok(failed2);

	});

	it("Global IZ still knows about its modules", function() {
		iz.Make_Prototypes_Global();
		var evil = iz.Module('Animals.EvilDuck');

		assert.ok(typeof evil === 'function');
	});

	it("non-Global IZ still doesn't know about global modules", function() {
		var failed = false;
		try {
			iz2.Module('Animals.EvilDuck');
		} catch (e) {
			failed = true;
		};
		assert.ok(failed);
	});

	it("Making non-global iz global allows it to see other global iz", function() {
		iz2.Make_Prototypes_Global(true);
		var evil = iz2.Module('Animals.EvilDuck');

		assert.ok(typeof evil === 'function');

	});

	it("non-global iz made global exposes its previously loaded modules", function() {
		var good = iz.Module('Animals.GoodDuck');
		assert.ok(typeof good === 'function');
	});

	it("making Global iz private loses access to global module list", function() {
		iz2.Make_Prototypes_Global(false);
		var failed = false;
		try {
			iz2.Module('Animals.EvilDuck');
		} catch (e) {
			failed = true;
		};
		assert.ok(failed);
	});

	it("making Global iz private loses access to it's original module list", function() {
		iz2.Make_Prototypes_Global(false);
		var failed = false;
		try {
			iz2.Module('Animals.GoodDuck');
		} catch (e) {
			failed = true;
		};
		assert.ok(failed);
	});	

	it("re-privated iz can load modules", function() {
		iz2.Use('Animals.GoodDuck');
		var good = iz2.Module('Animals.GoodDuck');
		assert.ok(typeof good === 'function');

	});	

});