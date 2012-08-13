var iz = require('iz');
var util = require('util');

function Log(handler, id) {
  return Proxy.create(
    { get: function(_, name) {
        console.log(id + " -> " + name);
        return handler[name];
      }
    });
}


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

	// localize my object
	var localized_obj = iz.localize(original);
	
	// outputs localized_obj.name = foo
	console.log("localized_obj.name = " + localized_obj.name);
	
	// setting name only affects name, the original age sticks around.
	localized_obj.name = 'bar';
	
	// outputs original.name = foo
	console.log("original.name = " + original.name);

	
	// outputs localized_obj.name = bar
	console.log("localized_obj.name = " + localized_obj.name);
	
	// outputs localized_obj.age = 18
	console.log("localized_obj.age = " + localized_obj.age);
	
	// setting the original in the parent is reflected in the localized copy, so long
	// as the localized copy has not yet been overridden. (happy birthday!)
	original.age = 19; 

	// outputs localized_obj.age = 19
	console.log("localized_obj.age = " + localized_obj.age);
	localized_obj.address.number = 2200;

	console.log("original.address.number = " + original.address.number);
	console.log("localized_obj.address.number = " + localized_obj.address.number);
	console.log("localized_obj.address.state = " + localized_obj.address.state);
	delete localized_obj.address['number'];
	console.log("post-delete localized_obj.address.number = " + localized_obj.address.number);
	// dump
	console.log("original dump: " + dump(original));

	// dump
	console.log("localized_obj dump: " + dump(localized_obj));

	
function dump(obj, prefix) {

	if (prefix === undefined) { 
		prefix = "" 
	};
	prefix += "    ";
	var string = prefix + "{";
	var keys = Object.keys(obj);
	for (var i = 0; i < keys.length ; i++) {
		//console.log('looking at ' + keys[i]);
		if (obj.hasOwnProperty(keys[i])) {
			string += "\n" + prefix + keys[i] + ": ";
			if (typeof(obj[keys[i]]) === 'object') {
				string +=  dump(obj[keys[i]], prefix);
			} else {
			string +=  obj[keys[i]]; 
			}
		}
	}
	string += "\n" + prefix + "}";
	return string;
}
