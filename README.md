## IZ Object System ##
    
The IZ Object System, or *iz*, provides a mechanism for the creation
of robust javascript objects. 
    
IZ is designed to make it easy to create objects and object hierarchies in a
way that will be familiar to most developers who have worked with object
oriented concepts in other languages. Behind the scenes, the iz object system does
this in a very Javascript native way and in the most efficient way practical,
using prototypical inheritence and other Javascript native mechanisms. In fact,
once the object is created, it is practically indistinguishable from any other 
Javascript object, as such no special handling is necessary even in code that 
knows nothing about IZ objects.

The end result is a very usable and approachable way of writing and using
objects in javascript, with complete support for features and abilities 
that are complex to implement in standard javascript.

Some features are:
    
* Multilevel class-like inheritance
* Mixins
* object intro-spection
* simple attribute creation
* private attributes that may only be get and set via method calls
* attribute type checking (including user-defined checking)
* deep object localization

### Creating 'Classes' ###

To begin with, Javascript doesn't have classes. So what the hell are we talking
about? We use the term 'Class' frequently in this documentation. IZ borrows the
name and  related nomenclature for familiarity and ease of understanding only.
IZ uses prototypical inheritance and uses 'Class names' only as a mechanism for
naming and retrieving prototypes.  What we call a class you could instead call a
'named prototype base object.'  (Yeah, we don't want to say that over and over
either, hence 'Class'.)

Ok... so getting on with it.  As with any node module you have to load iz in any
file you wish to use it in.  That looks like this:

	var iz = require('iz');

Now.. creating a Class is easy.  Create a new file and place the following in it.  
Save it as MyClass.js:

	var iz = require('iz');

	module.exports = iz.Package('MyClass', function(Class) {

		// all IZ packages must return Class at the end.
		return Class;
	});

Congratulations.  You have just created MyClass. You can use it in your own code
like so:

	iz.Use('MyClass');
	
	var MyClass = iz.Module('MyClass');
	var myobject = new MyClass();

The iz.Use() call is used to ensure that the Class you are about to use has been
loaded. The iz.Module() call returns the constructor function for the class you
requested.  Within node.js, iz.Use() returns the same as iz.Module(), so this 
is valid as well:

	var MyClass = iz.Use('MyClass');

	var myobject = new MyClass();

Which you choose is a matter of preference. 


So, we have a class, but it wouldn't be very useful as it doesn't contain anything.
We'd like our objects to have names... so let's give our class a name attribute using 
Class.has():

	var iz = require('iz');

	module.exports = iz.Package('MyClass', function(Class) {

		Class.has('name', { isa: 'string', default: 'Unknown' });

		return Class;
	});

The arguments to Class.has() are a string, and the attribute definition.  By default, the
name is 'Unknown', though.  And we don't want that... so when we create our object
we give it a name right away:

	var myobject = new MyClass({ name: 'Regina' });	
	// print out our object's name
	console.log("My Object is called " + myobject.name() );

What if we want to change our object's name?

	myobject.name('Reggy');

Now our object is called Reggy.  

That's all very interesting, but what we really want is class based behavior.  So let's add
a method.  This is just like adding a method to any other javascript object.

	module.exports = iz.Package('MyClass', function(Class) {

		Class.has('name', { isa: 'string', default: 'Unknown' });

		Class.greet_on_console = function() {
			console.log('Hi, My name is ' + this.name() );
		}

		return Class;
	});

Astute readers may have noticed that we suddenly have 'this'.  Right.  Methods
in IZ are just like any other method in javascript.  Inside a method call, 'this' 
is the instance of the object you are operating in.  So what's with 'Class', then?
Class inside the iz.Package() call is the base class.  Anything you add to it
will be added to the base class, and hence all objects created from the base
class will get it. 




