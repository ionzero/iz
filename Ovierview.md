## IZ Object System ##
    
The IZ Object System, or *iz*, provides a mechanism for the creation
of robust javascript objects.  Some features are:
    
* Multi-level class-like inheritance
* Mixins
* object intro-spection
* simple attribute creation
* private attributes that may only be get and set via method calls
* attribute type checking (including user-defined checking)
* deep object localization
    
IZ is designed to make it easy to create objects and object hierarchies in a
way that will be familiar to most developers who have worked with object
oriented concepts in other languages. Behind the scenes, the iz object system does
this in a very Javascript native way and in the most efficient way practical,
using prototypical inheritence and other Javascript native mechanisms. In fact,
once the object is created, it is indistinguishable from any other Javascript object,
as such no special handling is necessary.

The end result is a very usable and approachable way of writing and using
objects in javascript, with complete support for features and abilities 
that are complex to implement in standard javascript.

Example: 

    var Mynah = iz.Use('Animal.Bird.Mynah');
    var mymynah = new Myna({ mimic : 'duck' });
    mymynah.makesound(); // quack!
    mymynah.mimic('cow');
    mymynah.makesound(); // moo!

Note that while we use the term 'Class' frequently in this documentation.  It is
important to know that Javascript has no notion of a Class or namespace.  IZ borrows
the name and nomenclature for familiarity and ease of understanding only.  IZ uses
prototypical inheritance and uses 'Class names' only as a mechanism for naming and
retrieving prototypes.  

For more information on Javascript's prototypical inheritance (and many other goodies), 
please refer to Douglas Crockford's excellent book, 'Javascript: The Good Parts.'


### Class Declaration ###

Classes are defined by requiring 'iz' and then using the iz.Package
declaration. Classes can extend other classes. Classes can have
attributes with defaults. Attributes can also be set at object
construction time. Attributes can be private. Attributes can also have
a 'builder' which is a function that is called to define the attribute
value. This is necessary for things like Arrays.

Classes are found using directory path search (i.e. 'Bird.Duck' will be
found in 'Bird/Duck.js' (on node, this would be within the node_modules directory)

    var iz = require('iz');

    module.exports = iz.Package('Bird.Duck', { 'extends' : 'Bird' }, function(Class, SUPER) {

        // inherits all attributes of 'Bird'
        
        Class.has({
            type : { isa : 'string' },
            weight : { isa : 'number' },
            excitable : { isa : 'boolean', default: false }
        });

        Class.quack = function() {
            
            // if we are excitable, then we have a lot to say
            if (this.excitable()) {
                return "Quack Quack Quack Quack!";
            } else {
                return "Quack";
            }
        };
        
        // return the created class.  (DON'T FORGET TO DO THIS!)
        return Class;
    });

Note the above example is for a class defined in it's own file.  It is useful to
note that the iz.Package() routine is self-contained in it's effect, so while
it isn't recommended, many iz.Package() definitions can exist in a single file
without issue.

### Mixins ###

Mixins allow you to merge multiple objects or clases together. With a mixin,
the methods and attributes of one object or class are to the other class or 
object.

This can be especially useful when you want to create functionality that
would apply to many different types or classes of object. Creating a class
intended to be mixed in will allow you to add that functionality to any object
regardless of it's inheritance structure. In IZ mixins can be applied at
the class level or at the instance level, allowing run-time addition of 
defined functionality.


#### Example ####

    // do.stuff is a subclass of thingdoer
    iz.package('Authenticator', function (Class, SUPER) {
           
           // Lets log to whatever it is we log to.  This lets us do this.log();
           Class.mixin('MyApp.Logger');
    
           Class.authenticate = function (username, key) {
               
               var user_data = this.lookup_user(username);
               
               if (user && user.verified_key() === key) {
               
                   // we authenticated! Yay!  Log it.
                   this.log('Keyed Authentication succeeded for ' + username);
                   return user;
               
               } else {
               
                   // we failed authentication. :-(  Log it.
                   this.log('Keyed Authentication failed for ' + username);
               } 
           };
           
           return Class;
       }); 

### Introspection ###

All IZ objects can be interrogated for their abilities.  You can determine
whether an object can perform a certain action:

    var duck = new iz.Module('Bird.Duck')();

    duck.can('quack'); // returns true if duck.quack() would function

You can also inquire about what an object does using the does method.  This
includes both mixin based behavior and inheritance.  This is the preferred
method of testing an objects abilities:

    // returns true if Bird is a base class of this object OR if it has been mixed in.
    duck.does('Bird'); 
    
    // returns true if something in the class hierarchy has mixed in 'Flight'
    duck.does('Flight'); 

You can inquire whether the object inherits from a particular type. Note that this only
tells of actual inheritance and not mixins. In most cases, does() is a better alternative, 
but in some cases the actual class hierarchy may be important to you: 

    duck.isa('Bird.Duck');  // returns true if duck is a Bird.Duck object
    duck.isa('Bird'); // works with inherited classes also
    duck.isa(); // returns the name of the class duck is (Bird.Duck in this case)

All the information about a class can be retrieved using iz.get_metadata(object):

    var metadata = iz.metadata(duck);

### Localization ###

One of the advanced features of IZ introduces the concept of localization.
Localization in IZ could be described as a 'lightweight deep clone' as it
provides functionality similar to a deep clone but without the memory overhead.
When a localized copy of an object is created, the localized object looks and
acts exactly like the original. Very little additional memory is used to create
the localized copy as only changes made to the local copy are recorded.
Likewise,  changes to the original show through to the localized copy (except
where the change is hidden by changes in the localized copy) In many ways this
is similar to the concept of 'copy on write' (COW) that you may have encountered
elsewhere.

Localization provides the ability to do some very interesting things.  For
example, with localization you can pass a localized copy of an object to code
from a third party library and  be sure that no unintended modifications are
made, as you can discard the localized copy upon completion. Localization also
makes the concept of a 'rollback' or 'rewind' trivially simple to implement,
all while maintaining a small memory footprint.  It is also exceedingly useful
for debugging as it is possible to determine the exact changes made to large
data structures.

#### Example ####

    var original = {
        name: 'foo',
        age: 18
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

    // outputs original.age = 18
    console.log("original.age = " + original.age);
    
Note that localization works well with both IZ-created objects and simple
javascript objects. Depending on their construction, however, complex objects
created outside of IZ may store their state in a way that prevents reliable
localization (without modification). As such, these objects may not function
properly when localized. It is recommended that you create passing tests to
ensure proper behavior before and after attempting localization with 
such objects. (see the localization documentation for more information)

### Tetchy ###

The IZ object system has a "tetchy" mode which can be useful in development:

    iz.Tetchy(true);

Tells IZ whether it should be particularly tetchy about common misuses
/ coding mistakes. IZ will generally try to 'do the right thing' when
in ambiguous or confusing situations.

If iz.Tetchy() is set to true, iz will be very picky about how you
write your code and will throw exceptions when it encounters things it
considers likely to be an error.

For example, If you pass misnamed or unknown attributes to an object
constructor, with iz.Tetchy() set to false (the default), IZ will 
simply ignore these extra fields. With iz.Tetchy() set to true, it 
will throw an exception if it encounters a key it doesn't recognize. 
Think setting 'username' in the constructor when you meant 'user_name',
with Tetchy mode turned on, IZ would warn you about such a mistake.

Generally speaking, Tetchy will enforce some rules that might be helpful
during development / debugging. It can be useful during pre-production as
it will catch many easily missed coding mistakes.  That said, Tetchy mode 
does add a very small amount of overhead to normal object operations. This 
overhead is minimal is unlikely to significantly affect a normal 
application, but if you wrote your code well, it is not necessary, so it is 
by default set to false.

Note also that Tetchy is set globally for all IZ derived objects so turning it 
on in an application that uses modules you did not write could have unexpected
effects.

