## IZ Object System ##
    
The IZ Object System, or *iz*, provides a mechanism for the creation
of robust javascript objects.  Some features are:
    
    - Multi-level class-like inheritance
    - Mixins
    - object intro-spection
    - simple attribute creation
    - private attributes that may only be get and set via method calls
    - attribute type checking (including user-defined checking)
    - deep object localization.
    
It is designed to make it easy to create objects and object hierarchies in a
way that will be familiar to most developers who have worked with object
oriented concepts in other languages. Behind the scenes, the iz object system does
this in a very Javascript native way and in the most efficient way possible,
using prototypical inheritence and other Javascript native mechanisms.

The end result is a very usable and approachable way of writing and using
objects in javascript, with complete support for features and abilities that,
while possible, are complex to implement in standard javascript.

You must 'use' an IZ derived package before instantiating.

Example: 

    iz.Use('Animal.Bird.Parrot');
    var myparrot = new iz.Module('Animal.Bird.Parrot')({ mimic : 'duck' });
    myparrot.makesound(); // quack!
    myparrot.mimic('cow');
    myparrot.makesound(); // moo!


### Class Declaration ###

Classes are defined by requiring 'iz' and then using the iz.Package
declaration. Classes can extend other classes. Classes can have
attributes with defaults. Attributes can also be set at object
construction time. Attributes can be private. Attributes can also have
a 'builder' which is a function that is called to define the attribute
value. This is necessary for things like Arrays.

Classes are found using directory path search (i.e. 'Foo.Bar' will be
found in 'node_modules/Foo/Bar.js')

    var iz = require('iz');

    iz.Package('Foo.Bar', { 'extends' : 'Foo' }, function(Class) {

        Class.has({
            some_name : { isa : 'string', default : 'my name'},
            value_list : { isa : 'array', builder : function(meta){return new Array()}}
        });
        var counter_prv = Class.has('counter', { isa : 'number', private : true, default : 0 });

        Class.increment = function() {
            var counter = counter_prv.bind(this);
            return counter(counter()+1);
        }

        return Class;
    
    })


### Mixins ###

This is similar to Roles in perl or Mixins in other languages.  All
the methods and attributes of the package are copied by reference onto
the current object.  Note that because of this, any changes made to
the content of any array or object attributes will affect the original
class.

If you are creating classes to be included via the *mixin* mechanism,
you can provide an 'overlay_attributes' array attribute.  If this
attribute is present in the class to be mixed-in, it will be used to
determine the attributes to be copied. You can use this to control
what gets mixed.

Note that an optional array parameter can be added to specify the
specific attributes to copy.  If this parameter is provided, it will
override all other attribute specification possibilities. Great care
should be taken if you provide this as many methods have expectations
about what is available on the object they are attached to.  Therefore
this second parameter should only be used when you are intimately
familiar with the package in question.


#### Example ####

    // do.stuff is a subclass of thingdoer
    iz.package('do.stuff', { extends: 'thingdoer' }, function (root_object) {
           var self = root_object;
           
           // Also, a duck.
           self.mixin('Duck');

           self.do_things = function () {
               console.log('doing things!  also: ' + self.quack() );
           };
           return self;
       });


### Introspection ###

IZ classes can be inspected for inheritance and functionality:

    var foo = new iz.Module('Foo)({ value : 10 });
    var bar = new iz.Module('Foo.Bar')({ value : 1000 });
    bar.isa('Foo');
    bar.isa('Foo.Bar');
    foo.does('Mix'); // true


All the information about a class can be retrieved using:

    var metadata = iz.metadata(foo);

### Localization ###

localize returns an object to use in place of the original.  It should
have the state of the original, but any writes should affect only the
new object.  Ideally a localized object should see changes made to the
original if they have not been overridden in the localized object.
That is to say, a localized object should be 'copy on write' wherever
possible.  This method implements a generic localization routine for
iz objects, you may override this method if you need special handling.

#### Example ####

    var original = {};
    original.name = 'foo';
    original.age = 18;
    
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
    

### Tetchy ###

The IZ object system has a "tetchy" mode which can be useful in development:

    iz.Tetch(true);

Tells IZ whether it should be particularly tetchy about common misuses
/ coding mistakes. IZ will generally try to 'do the right thing' when
in ambiguous or confusing situations.

If iz.Tetchy() is set to true, iz will be very picky about how you
write your code and will throw exceptions when it encounters things it
considers likely to be an error.

For example, If you pass misnamed or unknown attributes to an object
constructor, with iz.Tetchy() set to false, IZ will simply ignore these extra
fields. With iz.Tetchy() set to true, it will throw an exception if it
encounters a key it doesn't recognize. Another example is that iz will throw
an exception if you attempt to inherit from a class that has not been loaded.

Generally speaking, Tetchy will enforce some rules that might be helpful
during development / debugging. Tetchy does add a very small amount of
overhead in various situations. This overhead is minimal and will not have
much, if any, effect on a normal application. Likewise if you wrote your code
well, it is not necessary, so it is by default set to false.

Note also that Tetchy is set globally for all IZ derived objects so turning it 
on in an application that uses modules you did not write can be problematic.

