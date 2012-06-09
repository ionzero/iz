/*
file: iz.js

Class: Ionzero Object System 
	
Overview:

The Ionzero Object System, or *iz*, provides a mechanism for the creation of robust
javascript objects.  Some features are:
    
    - Multi-level inheritance
    - Mixins 
    - object intro-spection
    - simple attribute creation
    - protected attributes that may only be get and set via method calls
    - attribute type checking (including user-defined checking)
    
It is designed to make it easy to create objects and object hierarchies in a
way that will be familiar to most developers who have worked with Object
Oriented concepts in other languages. Behind the scenes, the iz system does
this in a very Javascript native way and in the most efficient way possible,
using prototypical inheritence and other Javascript native mechanisms.

The end result is a very usable and approachable way of writing and using
objects in javascript, with complete support for features and abilities that,
while possible, are difficult to implement in 'standard' javascript.

*/
"use strict";

var VERSION = "1.1";
var iz = {};

//console.log('AIEEEEEEE');
function IZ() {}
var proto = IZ.prototype;
var prv = {
    loaded_packages: {},
    js_base: '',
    tetchy: false
};

function iz_merge_meta_attributes(destination, origin) {
    var attr;
    for (attr in origin.attributes) {
        if (!destination.attributes.hasOwnProperty(attr)) {
            destination.attributes[attr] = origin.attributes[attr];
        }
    }
}

function iz_check_attribute_value(details, name, value) {
    var ok = false;
    if (details['isa'] !== undefined) {
        if (typeof value === 'object') {
            if (details['isa'] === 'object') {
                ok = true;
            } else if (details['isa'] === 'array' && value.length) {
                ok = true;
            } else if (value['does'] !== undefined && typeof value['does'] === 'function' && value.does(details['isa'])) {
                ok = true;
            }
        } else if (typeof value === details['isa']) {
            ok = true;
        }
        if (!ok) {
            throw (name + " attribute: trying to use a " + (typeof value) + " in a " + details['isa'] + " field");
        }
    } else {
        ok = true;
    }
    return ok;
}

proto['VERSION'] = VERSION;
//proto['prv.loaded_packages'] = {};


/*
Group: IZ utility routines

method: iz.Use(classname) 

Ensures that classname is loaded and available to be used.  Since this loads the class from the remote server, it is likely
that iz.Use will return before the javascript is actually loaded by the browser.  It is therefore recommended to avoid using
'use' in reaction to browser events.  

The path to the JS in question is based on a javascript prefix provided via the iz.js_base() method.  Each '.' in the 
classname is translated to a '/' in the path, and a '.js' is appended.  This is best illustrated by an example.  
If iz.js_base() is '/js/', a class named 'My.Animals.SuperDuck' would load '/js/My/Animals/SuperDuck.js' 

Note that the js is loaded into the head of the current document, so anything contained within the js file will be 
executed immediately.

*EXPERIMENTAL* This mechanism is still experimental.  It's still a better idea to preload the classes you will be using
directly if you know what they are.

Parameters:
    classname - Class to be loaded
    
Returns
    nothing

(start code)
iz.Use('My.Animals.SuperDuck');
(end)

*/
iz.Use = function (packagename) {
    if (prv.loaded_packages[packagename] !== undefined) {
        return iz.Module(packagename);
    }
    console.log(packagename);

    var path = packagename.replace(/\./g, '/');
    console.log(iz.js_base() + path);

    iz.require(path);
	return iz.Module(packagename);
};

iz.require = function(path) {
    // this needs to be modified to allow loading based on the environment...
    // for now, we just do the node thing.
    if (typeof require === 'function') {
        return require(path);
    } else if (process === undefined && document !== undefined) {     
            var script=document.createElement('script');
            script.setAttribute("type","text/javascript");
            script.setAttribute("src", path);
            document.getElementsByTagName("head")[0].appendChild(script);
    } else {
        throw "Unable to load js file - No require() and no document. How do I do it?";
    }
}

/* 
method: iz.Tetchy(true_or_false)

Tells IZ whether it should be particularly tetchy about common misuses /
coding mistakes. IZ will generally try to 'do the right thing' when in
ambiguous or confusing situations.

If iz.Tetchy() is set to true, iz will be very picky about how you write your
code and will throw exceptions when it encounters things it considers likely
to be an error.

For example, If you pass misnamed or unknown attributes to an object
constructor, with iz.Tetchy() set to false, IZ will simply ignore these extra
fields. With iz.Tetchy() set to true, it will throw an exception if it
encounters a key it doesn't recognize. Another example is that iz will throw
an exception if you attempt to inherit from a class that has not been loaded.

Generally speaking, Tetchy will enforce some rules that might be helpful
during development / debugging. Tetchy does add a very small amount of
overhead in various situations. This overhead is minimal and will not have
much, if any, effect on a normal application. Likewise if you wrote your code
well, it is not necessary, so it is by default, set to is false.

Note also that Tetchy is set globally for all IZ derived objects so turning it 
on in an application that uses modules you did not write can be problematic.

*/
iz.Tetchy = function (tetchy) {
    if (tetchy !== undefined) {
        if (tetchy) {
            prv.tetchy = true;
        } else {
            prv.tetchy = false;
        }
    }
    return prv.tetchy;
}

/*
method: iz.js_base(base_path)

Gets or Sets the base file prefix for iz based JS files. Defaults to '' which
will let node load the module using it's normal path resolution process.
Should not be set unless you know what you are doing. This is a global for the
iz system, so setting it will make things fail if the files are not in the
path defined.

Parameters:    
    base_path - path to the base of the javascript hierarchy.
    
Returns:
    Current base path
    
Example:

(start code)
iz.js_base('/opt/foo/js/');

// the following loads: /opt/foo/js/Somewhere/Animals/SuperDuck.js
iz.Use('Somewhere.Animals.SuperDuck'); 
(end)
*/

iz.js_base = function (base) {

    if (base !== undefined) {
        prv.js_base = base;

        // make sure we end in a slash.
        if (prv.js_base.charAt(prv.js_base.length - 1) !== '/') {
            prv.js_base = prv.js_base + '/';
        }
    }
    return prv.js_base;
};


/* 
method: iz.Module(classname)

Gets the class with the name provided. Almost always used with a new() immediately following.

Parameters:    
    classname - Name of the class to obtain.
    
Returns:
    Prototype object for the class provided.
    
Example:

(start code)
var bad_duck = iz.Module('Somewhere.Animals.SuperDuck').new({ disposition: 'evil' });
(end)
    
*/

iz.Module = function (packagename) {
    var root = prv.loaded_packages[packagename];

    if (root === undefined) {
        // yes.... we could load it for you... but forget that.  Learn how to program.
        throw ("ModuleError: " + packagename + " was not found.  Perhaps you forgot to 'use' it?");
    } else {
        return root;
    }
};

/* 
method: proto.new(args)

Creates a new instance of the package class.  It is called against the package prototype object. This is
almost always done as a chained method from an iz.Module() call.  

Parameters:    
    args - Object literal containing attributes to be set upon object creation.
    
Returns:
    Instance of the prototype class.
    
Example:

(start code)
var good_duck = iz.Module('Somewhere.Animals.SuperDuck').new({ disposition: 'good' });
(end)
*/
proto.new_object = function (args) {
    var superclass = this;
    var F = function () {};
    F.prototype = superclass;

    var self = new F();
    var private_vars = {};
    var has_been_set = {};

    // These functions are added to each object.  They are closures which
    // encapsulate the private variables, which make the real variables not accessible.
    self['_get_attribute_value'] = function (name) {
        if (has_been_set[name] === undefined) {
            var val = this.get_default(name);
            if (val !== undefined) {
                this['_set_attribute_value'](name, val);
            }
            has_been_set[name] = 1;
        }
        return private_vars[name];
    };

    // Calling check_value means that you can provide your own checking when you create the attribute.
    self['_set_attribute_value'] = function (name, value) {
        if (value !== undefined) {
            if (this.meta.attributes[name].check_value.call(this, this.meta.attributes[name], name, value)) {
                private_vars[name] = value;
                has_been_set[name] = 1;
            }
        }
        return this['_get_attribute_value'](name);
    };
    if (args) {
        var attr;
        for (attr in args) {
            //console.log(attr + ' being initialized');
            if (typeof self[attr] === 'function') {
                //console.log(attr + ' being set');
                self[attr](args[attr]);
            } else {
                if (iz.Tetchy()) {
                    throw "IZ.Tetchy: " + this.meta.classname + " has no attribute named " + attr;
                }
            }
        }
    }

    return self;
};

/*
Group: Class definition methods

method: iz.package(classname, inheritance, closure)
    
Creates a new package and registers it's namespace. 

Parameters:

    packagename - Namespace of class to be created
    inheritance - Object containing inheritance details
    closure - Function reference containing the body of the class to be created.

Returns: 

    Class prototype object

Example:
(start code)
iz.package( 'MyAwesomeClass', 
              {
                   extends: 'MyOtherClass',
                   mixin: [ Some, Other, Classes ]
              }, 
              function (self) { 
                    // do stuff 
                    // it's very important to return self;
                    return self;
              });
(end)

The closure function is used to create a _prototype_ object.  The object returned at the end of the closure is used
as the prototype for any created objects.  As such, you should avoid doing anything that creates state within
the closure, as this state would be fixed for ALL instances of this class.  

*/
iz.Package = function (packagename, inheritance, closure) {
    var self;
    if (typeof inheritance === 'function') {
        closure = inheritance;
        inheritance = {};
    }
    // process inheritance.
    if (inheritance['extends']) {
        if (prv.loaded_packages[inheritance['extends']] === undefined || prv.loaded_packages[inheritance['extends']].constructor === undefined) {
            // does this belong here?  Should we just yell when you don't do it?
            // I think it's safe for now.... maybe....
            if (iz.Tetchy()) {
                throw "iz.Tetchy: " + packagename + " inherits from " + inheritance['extends'] + " but " + inheritance['extends'] + " has not been loaded";
            } else {
                iz.Use(inheritance['extends']);
            }
        }
        var Superclass = prv.loaded_packages[inheritance['extends']].constructor;
        if (Superclass !== undefined) {
            var F = function () {};
            F.prototype = new Superclass();
            self = new F();
            self['meta'] = {
                attributes: {}
            };
            if (F.prototype.meta !== undefined && typeof F.prototype.meta['ISA'] === 'object') {
                self.meta['ISA'] = [packagename].concat(F.prototype.meta['ISA']);
                iz_merge_meta_attributes(self.meta, F.prototype.meta);

            } else {
                self.meta['ISA'] = [packagename];
            }
            // prototypical access to super (inspired by Javascript: the good parts)
            self['super'] = function (name) {
                var that = self;
                var method = F.prototype[name];
                return function () {
                    return method.apply(that, arguments);
                };
            };
        } else {
            throw ("ModuleError: " + inheritance['extends'] + " not defined");
        }
    } else {
        self = new IZ();
        self['meta'] = {
            attributes: {}
        };
        self.meta['ISA'] = [packagename];
        self['super'] = function (name) {
            throw ("ModuleError: Attempting to call super." + name + " on " + packagename + ", which is a base class");
        };
    }
    self.meta['does'] = {};
    self.meta['classname'] = packagename;

    if (inheritance['mixin'] !== undefined) {
        if (typeof inheritance['mixin'] === 'array') {
            var mixin_obj;
            for (mixin_obj in inheritance['mixin']) {
                self.mixin(mixin_obj);
            }
        } else {
            self.mixin(inheritance['mixin']);
        }
    }
    
    var CONS = function () {
        return closure(self);
    };
    
    var base_class = new CONS();
    prv.loaded_packages[packagename] = function(args) {
        return base_class.new_object(args);
    };
    prv.loaded_packages[packagename].base_class = base_class;
    prv.loaded_packages[packagename].constructor = CONS;
    return prv.loaded_packages[packagename];
};

/*
method: self.has(attributename, definition)

Defines a new object attribute.

Parameters:    
attribute - Attribute name to add
definition - Attribute definition object literal

Attribute Definition:

The definition provides information about the attribute.  The available options are
 

    isa - defines a type requirement for this element.
          valid options are: boolean, number, string, function, array, object, classname (iz class name)
            
    ro - Sets attribute to be read-only (true/false) Read only values can only be in the new() call.  All other 
         attempts to set a value will be ignored.
             
    builder - function to be used to get a default value.  '*this*' will be the object the builder is being called on, and
              the first argument will be the field name the builder is being called on.  called as: this.builder(fieldname)
              Should return the value to be used.

    default - provides a default value for the field if none is provided during the new() call.
    
    check_value - function that is used to override the type checking with custom behavior.  Called with attribute details
                  as first argument, attribute name as second and value as the third.  
                  Called as: this.check_value(attribute_details, fieldname, value)


*Note* that the builder / default values are not set until the value is requested, not at object creation.  This can have 
unexpected results if your builder routine is time-sensitive.  If this is the case, be sure to request the value immediately
after object creation with new();

Returns:
nothing

Example:

(start code)
 // within package definition
 self.has('friend', {
                        isa: 'Duck',
                        ro: true,     // You can't change friend once your object is created
                        builder: function (name) {
                                                    // create a duck object if we didn't get one.
                                                    return iz.Module('Duck').new();
                                                }
                        
                    })

(end)
*/

proto.has = function (name, detail) {
    // if we get an object as 'name' then we probably have a list of attributes, we can roll like that.
    if (typeof name === 'object') {
        var fieldname;
        for (fieldname in name) {
            this.has(fieldname, name[fieldname]);
        }
        return;
    }

    // if we are tetchy, don't tolerate extra fields in the detail of a has
    if (iz.Tetchy()) {
        var attr, i;
        var options = [ 'default', 'ro', 'builder', 'check_value', 'isa' ];
        var valid;
        for (attr in detail) {
            valid = false;
            for (i = 0 ; i < options.length; i++ ) {
                if (attr === options[i]) {
                    valid=true;
                }
            }
            if (!valid) {
                throw "iz.Tetchy: " + this.meta.classname + " tried to use an invalid attribute detail '" + attr + "' in " + name;
            }
        }
    }
    
    if (detail !== undefined) {
        this.meta.attributes[name] = detail;
    } else {
        this.meta.attributes[name] = {};
    }

    if (typeof this.meta.attributes[name]['check_value'] !== 'function') {
        this.meta.attributes[name]['check_value'] = iz_check_attribute_value;
    }

    if (this.meta.attributes[name]['ro']) {
        this[name] = function () {
            return this['_get_attribute_value'](name);
        };
    } else {
        this[name] = function (value) {
            return this['_set_attribute_value'](name, value);
        };
    }
};




/*
method: self.mixin(class)

Adds the functionality of the given class to self.  This is similar to Roles in perl or Mixins in other languages.
All the methods and attributes of the package are copied by reference onto the current object.  Note that 
because of this, any changes made to the content of any array or object attributes will affect the original class.  

If you are creating classes to be included via the *mixin* mechanism, you can provide an 'overlay_attributes' array attribute. 
If this attribute is present in the class to be mixed-in, it will be used to determine the attributes to be copied. You 
can use this to control what gets mixed.  

Parameters:    
methodname - method to inquire about

Returns:
bool - True / False 

Example:

(start code)
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
(end)

Note that an optional array parameter can be added to specify the specific attributes to copy.  If this parameter
is provided, it will override all other attribute specification possibilities. Great care should be taken if you 
provide this as many methods have expectations about what is available on the object they are attached
to.  Therefore this second parameter should only be used when you are intimately familiar with the package in question.

*/

proto.mixin = function (mixin_class, overlay_attributes) {
    var mixin_source;
    var root_object = Object;
    var attr, i;

    if (typeof mixin_class === 'object') {
        mixin_source = mixin_class 
    } else {
        mixin_source = iz.Module(mixin_class).base_class;
    }

    if (mixin_source !== undefined) {
        this.meta.does[mixin_source] = 1;
        if (overlay_attributes === undefined) {
            if (mixin_source.hasOwnProperty('overlay_attributes')) {
                overlay_attributes = mixin_source.overlay_attributes;
            } else {
                overlay_attributes = [];
                for (attr in mixin_source) {
                    if (typeof root_object.prototype[attr] === "undefined" && typeof IZ.prototype[attr] === "undefined") {
                        overlay_attributes.push(attr);
                    }
                }
            }
        }

        for (i = 0; i < overlay_attributes.length; i++) {
            attr = overlay_attributes[i];
            // don't copy meta wholesale... that makes the class very confused about itself.  
            if (attr !== 'meta') {
                // copy any attribute metadata if we have it.
                if (mixin_source.meta !== undefined && typeof mixin_source.meta['attributes'] === 'object' && mixin_source.meta.attributes[attr]) {
                    this.meta.attributes[attr] = mixin_source.meta.attributes[attr];
                }
                this[attr] = mixin_source[attr];
            }
        }
    }
    return this;
};

/*
Group: Object instance methods

method: obj.does(classname)

Introspection routine, returns true if obj can do what classname does.  This checks both for subclassing as well as role application (mixins).

Parameters:    
classname - Class to inquire about

Returns:
bool - True / False 

Example:

(start code)
 if (obj.does('Duck')) {
    // Here we only care if you can act like a duck 
    obj.quack();
 }
(end)
*/
proto.does = function (packagename) {
    if (this.meta.does[packagename]) {
        return true;
    }
    // if we get here, we didn't find a does, but we'll check the isa just to be sure.
    return this.isa(packagename);
};

/*
method: obj.isa(classname)
 
Introspection routine, returns true if obj is a member or subclass of the class provided, false otherwise.  
Useful for checking actual class membership. *NOTE* in most cases you probably want to use <obj.does()> instead.

Parameters:    
 classname - Class to inquire about

Returns:
 bool - True / False 

Example:

(start code)
  if (!obj.isa('Duck')) {
        // here you MUST be a duck or a duck subclass.
        throw "HEY! Only REAL ducks are allowed here!";
  }
(end)
 */
proto.isa = function (packagename) {
    var i;
    for (i = 0; i < this.meta['ISA'].length; i++) {
        if (this.meta['ISA'][i] === packagename) {
            return true;
        }
    }
    // if we get here, we didn't find it.
    return false;
};


/*
method: obj.can(methodname)

Introspection routine, returns true if obj has a method called 'methodname' 

Parameters:    
methodname - method to inquire about

Returns:
bool - True / False 

Example:

(start code)
if (obj.can('quack')) {
    // Here we only care if you can quack
    obj.quack();
}
(end)
*/
proto.can = function (methodname) {
    return (typeof this[methodname] === 'function');
};

/* 
method: obj.get_default(attributename)
 
Returns the default value for a given attribute.  Uses the 'default' value or the 'builder' function as set in 
the attribute definition.  Note that this returns the default, it does not set the field to that default.  If you 
want to do that, you will need to set the value to the result of this call.

Parameters:    
 attributename - attribute to inquire about

Returns:
 value - default value the field would have.

Example:

(start code)
  var friend_default = obj.get_default('friend');
(end)

 */
proto.get_default = function (name) {
    var val;
    if (typeof this.meta.attributes[name]['builder'] === 'function') {
        val = this.meta.attributes[name].builder.call(this, name);
    } else if (this.meta.attributes[name]['default'] !== undefined) {
        val = this.meta.attributes[name]['default'];
    }
    return val;
};


/* 
method: obj.get_current_state()

The get_current_state method returns a flat 'generic' javascript object representing the state of the object.  
This object only contains the attributes and their values as key-value pairs. Keep in mind that the returned object 
has no connection to the original whatsoever.  As such, modifying its values will have no effect on the original
object, nor will it's values keep in sync with the original.  This is, in short, primarily useful for inspection, 
as iz object attributes are private and will not be visible via things like node's util.inspect() routine.

The get_current_state method also provides a simple way to clone an object, as you can call get_current_state and pass
the resulting object to the class' constructor.  

Note that get_current_state by default only loads attributes created with has() - if you have other private data or state
it is recommended that you override this method in your class;

(start code)

    // clone my_message_object
    var cloned_msg_obj = new Message( my_message_object.get_current_state() );
    
    // cloned_msg_obj and my_message_object now have the same state. 
    // We can use node's util.inspect to verify this
    console.log("my_message_object: "  + util.inspect(my_message_object.get_current_state()));
    console.log("cloned_msg_obj: "  + util.inspect(cloned_msg_obj.get_current_state()));

*/
proto.get_current_state = function() {
    var attr;
    var out = {};
    for (attr in this.meta.attributes) {
        out[attr] = this[attr]();
    }
    return out;
}

module.exports = iz;

/*
Copyright:
	Copyright (c) 2011 Jason Kuri

License:
	Proprietary - Use is allowed only by express written permission.

Version:
	1.1
*/