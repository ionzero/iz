/*
file: iz.js

Class: IZ Object System 
	
Overview:

The IZ Object System, or *iz*, provides a mechanism for the creation of robust
javascript objects.  Some features are:
    
    - Multi-level class-like inheritance
    - Mixins
    - object intro-spection
    - simple attribute creation
    - protected attributes that may only be get and set via method calls
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

Example: 

	var Parrot = iz.Use('Animal.Bird.Parrot');
	var myparrot = new Parrot({ mimic: 'duck' });
	mina.makesound(); // quack!
	mina.mimic('cow');
	mina.makesound(); // moo!

*/
"use strict";

var util = require('util');
var VERSION = "1.1";


// iz is the core library, where the iz helper routines live.
var iz = {};

// base constructor function.
function IZ() {}

// proto is the 'base' IZ object, which gives access to all the iz core object behavior.
var proto = IZ.prototype;

proto['VERSION'] = VERSION;

var prv = {
    loaded_packages: {},
    js_base: '',
    tetchy: false
};

// internal functions to perform various activities.
// here because they get reused a lot, so we want 
// to, you know, reuse them.
function iz_merge_meta_attributes(destination, origin) {
    var attr;
    for (attr in origin.attributes) {
        if (!destination.attributes.hasOwnProperty(attr)) {
            destination.attributes[attr] = origin.attributes[attr];
        }
    }
}
// Checks attribute for specific type and checks that against the type allowed in the details field.
// 'name' parameter only used for throwing back an error 
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
            throw new Error(name + " attribute: trying to use a " + (typeof value) + " in a " + details['isa'] + " field");
        }
    } else {
        ok = true;
    }
    return ok;
}

function iz_default_constructor(object, args) {
	
}


/*
Group: IZ utility routines

method: iz.Use(classname) 

Ensures that classname is loaded and available to be used.  Returns the base class of the object.  

Use will load the class if it has not been loaded before, otherwise it uses the class that has already been loaded.  

Under node, this loads the class using require(), which is syncronous.  

Class naming and filenames:

Class names are separated by periods '.' representing containing namespace.  When the object is being loaded with 'Use'
this namespace is translated to a path.  Each class component preceeding a . is treated as a directory.  For example, 
to load 'MyApp.Animals.MegaDuck', iz would treat the file to be loaded as 'MyApp/Animals/MegaDuck.js'

Parameters:
    classname - Class to be loaded
    
Returns
    nothing

(start code)
var MegaDuckClass = iz.Use('My.Animals.MegaDuck');
(end)

*/
iz.Use = function (packagename) {
    if (prv.loaded_packages[packagename] !== undefined) {
        return iz.Module(packagename);
    }
    //console.log(packagename);

    var path = packagename.replace(/\./g, '/');
    //console.log(iz.js_base() + path);

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
        throw new Error("Unable to load js file - No require() and no document. How do I do it?");
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

Gets the class with the name provided. 

Almost always used with a preceeding 'new'. (View Example)

Parameters:
    classname - Name of the class to obtain.
	NEW: classname should be sent through .Use function first either directly or indirectly through other means (iz.Package, etc)
	
Returns:
    Prototype object for the class provided.
    
Example:

(start code)
var bad_duck = new iz.Module('Somewhere.Animals.SuperDuck')({ "disposition": "evil" });
(end)
   
*/

iz.Module = function (packagename) {
    var root = prv.loaded_packages[packagename];

    if (root === undefined) {
        // yes.... we could load it for you... but forget that.  Learn how to program.
        throw new Error("ModuleError: " + packagename + " was not found.  Perhaps you forgot to 'Use' it?");
    } else {
        return root;
    }
};

/* 
method: proto.new_object(args, [object_to_localize])

Creates a new instance of the package class.  It is called against the package prototype object. 
  
Note: This object should not be called directly. Refer to example for proper usage.

Parameters:    
    args - Object literal containing attributes to be set upon object creation.
    
Returns:
    Instance of the prototype class.
    
Example:

(start code)
var good_duck = new iz.Module('Somewhere.Animals.SuperDuck')({ "disposition": "good" });
(end)
*/
proto.new_object = function (args, object_to_localize) {
    var superclass = this;
    var F = function () {};
    F.prototype = superclass;

    var self = new F();
    var private_vars = {};
    var has_been_set = {};
	//var parent = object_to_localize;

	self['_has_been_set'] = function (arg) {
		return (has_been_set[arg] === 1);
	};
	
    // These functions are added to each object.  They are closures which
    // encapsulate the private variables, which make the real variables not accessible.
    self['_get_attribute_value'] = function (name) {
		var val;
        if (!this['_has_been_set'](name)) {
			// are we localized?  if so, do we have a value from the parent? if so, get it.
			// we have to check _has_been_set - because we don't want to trigger defaulting
			// on our parent object.  The defaulting should happen on our current object.
			// also, we need to localize any objects we get back.... to make deep localization work.
			// Ok... I need a beer.
			if (object_to_localize !== undefined && object_to_localize['_has_been_set'](name)) {
				val = object_to_localize[name]();
				if (typeof val === 'object') {
					this['_set_attribute_value'](name, iz.localize(val));
				} else {
					return val;
				}
			} else {
	            val = this.get_default(name);
	            if (val !== undefined) {
	                this['_set_attribute_value'](name, val);
	            }
	            has_been_set[name] = 1;
			}
        }
        return private_vars[name];
    };
    
    // This should return only data that is changed in the localized copy.  
    self['_get_only_localized_data'] = function() {
        var attr;
        var out = {};
        for (attr in this._.attributes) {
            if (private_vars[attr] !== undefined) {
                out[attr] = this[attr]();
                if (typeof out[attr] === 'object' && typeof out[attr]['_get_only_localized_data']) {
                    out[attr] = out[attr]._get_only_localized_data();
                } 
            }
        }
        return out;
    };

    // Calling check_value means that you can provide your own checking when you create the attribute.
    self['_set_attribute_value'] = function (name, value) {
        if (arguments.length == 2) {
            if (this._.attributes[name].check_value.call(this, this._.attributes[name], name, value)) {
                private_vars[name] = value;
                has_been_set[name] = 1;
            }
        }
        return this['_get_attribute_value'](name);
    };
	if (typeof(self.CONSTRUCT) === 'function') {
		// if we have a constructor routine, we call it.  We should always have one
		// but you never know.
		return self.CONSTRUCT(args, object_to_localize);
	} else {
	    return self;		
	}

};

/* 

method: proto.CONSTRUCT(args, [object_to_localize])

CONSTRUCT is called immediately after a new object is created. The arguments passed in the 'new' call
are passed in to the CONSTRUCT method. The default CONSTRUCT is sufficient in most cases and is what is 
responsible for setting initial attribute values and for calling superclass constructors. Note that 
classes used as mixins do not have their CONSTRUCT method called. 

*NOTE:* Overriding CONSTRUCT can cause unusual behavior, it is best to leave CONSTRUCT alone unless you 
need special class-level initialization during the new call. This is NOT the way to create a factory,
or to do other random class hijinks. In other words, if you are thinking about overriding CONSTRUCT, 
think hard.  Then think again.  Then write an init() method instead.  If you can't make that work, 
write a passing test for your module then add CONSTRUCT... and remember to call the 
superclass' CONSTRUCT, and return 'this'. 

Parameters:    
    args - Object literal containing attributes to be set upon object creation.
    
Returns:
    Instance of the object class to be returned to the caller.

*/
proto.CONSTRUCT = function(args, object_to_localize) {
	var me = this;
    
	if (args) {
        var attr;
        for (attr in args) {
			// If we have an accessor function for the attribute provided, we call it. 
			// note that this allows running any method with the arguments provided, during initialization.
            if (typeof me[attr] === 'function') {
                if (!this._.attributes[attr]['ro']) {
                    me[attr](args[attr]);                                        
                } else {
                    // if it's ro, we need to call the set routine directly, as the accessor is read-only
                    // this is only allowed during initial object creation
                    me['_set_attribute_value'](attr, args[attr]);
                }
            }
        }
    }

	return me;
}

/*
Group: Class definition methods

method: izmix(classname, inheritance, closure)
    
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
	var Superclass;
	var F;
	
    if (typeof inheritance === 'function') {
        closure = inheritance;
        inheritance = {};
    }

    // process inheritance.
    if (inheritance['extends'] !== undefined) {

		// We want to inherit from the main base class - we need an object to inherit from. We ask
		// for the package's base_class();
	    // we are inheriting from a iz class.  We may want to add a way to inherit from a 'generic' class, 
		// but this gets tricky, so for now, we leave that as an exercise for future generations
        if (prv.loaded_packages[inheritance['extends']] === undefined || prv.loaded_packages[inheritance['extends']].constructor === undefined) {
            // does this belong here? We just yell when you don't do it?
            // I think it's safe for now.... maybe....
            if (iz.Tetchy()) {
                throw new Error("iz.Tetchy: " + packagename + " inherits from " + inheritance['extends'] + " but " + inheritance['extends'] + " has not been loaded");
            } else {
                iz.Use(inheritance['extends']);
            }
        }
        Superclass = prv.loaded_packages[inheritance['extends']].base_class();

        if (Superclass !== undefined) {
			F = function () {};
            F.prototype = Superclass;
            self = new F();
			self['_'] = {
                attributes: {}
            };
            if (F.prototype._!== undefined && typeof F.prototype._['ISA'] === 'object') {
                self._['ISA'] = [packagename].concat(F.prototype._['ISA']);
                iz_merge_meta_attributes(self._, F.prototype._);
            } else {
                self._['ISA'] = [packagename];
            }
            
            // prototypical access to super (inspired by Javascript: the good parts)
            self['super'] = function (name) {
                var that = this;
                var method = F.prototype[name];
				if (typeof(method) === 'function') {
	                return function () {
	                    return method.apply(that, arguments);
	                };
				} else {
					// if it's not a function, return it.  
					// this also handles the case where method is actually undefined.
					return method;
				}
            };
        } else {
            throw new Error("ModuleError: " + inheritance['extends'] + " not defined");
        }
    } else {
        self = new IZ();
		self['_'] = {
			attributes: {}
        };
        self._['ISA'] = [packagename];
		// super on a base class does nothing.  
        self['super'] = function (name) {
            //throw ("ModuleError: Attempting to call super." + name + " on " + packagename + ", which is a base class");
            return undefined;
        };
    }
    
    self._['does'] = {};
    self._['classname'] = packagename;

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

    prv.loaded_packages[packagename] = function(args, obj_to_localize) {
        return prv.loaded_packages[packagename].base_class().new_object(args, obj_to_localize);
    };
    
    // this makes it possible to instantiate the 'base class' prototype object 
    // once and only once per application.  This means every item of this 'class' 
    // inherits from a single prototype object.  It also means that if nothing ever
    // inherits from this 'class' the prototype object is never created.
    var base_class;
    prv.loaded_packages[packagename].base_class = function () {
        if (base_class === undefined) {
            base_class = new CONS();
        }
        return base_class;
    }
    // = base_class;
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
unexpected results if your builder routine is time-sensitive (and might be a good reason to create an 'init' method instead).  

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
                throw new Error("iz.Tetchy: " + this._.classname + " tried to use an invalid attribute detail '" + attr + "' in " + name);
            }
        }
    }
    
    if (detail !== undefined) {
        this._.attributes[name] = detail;
    } else {
        this._.attributes[name] = {};
    }

    if (typeof this._.attributes[name]['check_value'] !== 'function') {
        this._.attributes[name]['check_value'] = iz_check_attribute_value;
    }

    if (this._.attributes[name]['ro']) {
        this[name] = function () {
            if (arguments.length >= 1) {
                throw new Error("Attempt to change value of read-only attribute '" + name + "' on class " + this._.classname);
            }
            return this['_get_attribute_value'](name);
        };
    } else {
        this[name] = function (value) {
			if (arguments.length === 1) {
            	return this['_set_attribute_value'](name, value);
			} else {
				return this['_get_attribute_value'](name);
			}
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

    if (typeof(mixin_class)=== 'object') {
        mixin_source = mixin_class;
    } else {
        mixin_source = iz.Module(mixin_class).base_class();
    }

    if (mixin_source !== undefined) {
        this._.does[mixin_source] = 1;
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
            // don't copy meta wholesale... that makes the class very confused about itself.  Also, don't overwrite things that already exist in the actual object.
            if (attr !== '_' && !this.hasOwnProperty(attr)) {
                // copy any attribute metadata if we have it.
                if (mixin_source._ !== undefined && typeof mixin_source._['attributes'] === 'object' && mixin_source._.attributes[attr]) {
                    this._.attributes[attr] = mixin_source._.attributes[attr];
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
    if (this._.does[packagename]) {
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
        throw new Error("HEY! Only REAL ducks are allowed here!");
  }
(end)
 */
proto.isa = function (packagename) {
    var i;
    for (i = 0; i < this._['ISA'].length; i++) {
        if (this._['ISA'][i] === packagename) {
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
	return iz.can(this, methodname);
};

iz.can = function(obj, methodname) {
    return (typeof obj[methodname] === 'function');
}

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
    if (typeof this._.attributes[name]['builder'] === 'function') {
        val = this._.attributes[name].builder.call(this, name);
    } else if (this._.attributes[name]['default'] !== undefined) {
        val = this._.attributes[name]['default'];
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

(end code)
*/
proto.get_current_state = function() {
    var attr;
    var out = {};
    for (attr in this._.attributes) {
        // add deep recursion here?
        out[attr] = this[attr]();
    }
    return out;
}

/*

method: obj.localize()

localize returns an object to use in place of the original.  It should have the state
of the original, but any writes should affect only the new object.  Ideally a localized object
should see changes made to the original if they have not been overridden in the localized object.
That is to say, a localized object should be 'copy on write' wherever possible.  This method
implements a generic localization routine for iz objects, you may override this method if you 
need special handling.  

(start code)

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
	
(end code)
*/

/* TODO - Allow inspection of the actual whiteout and local data - so that you can tell what changes have
   been made to an object over time.  */
   
iz.localize = function(parent) {
    if (typeof(Proxy) === 'undefined') {
        throw new Error("Localize Failure! iz.localize requires Harmony Proxy capability and it is not available. Did you forget to run with --harmony_proxies").stack;
    }
    
	// if the parent object has it's own create_localized function, we use it.
	if (typeof parent.create_localized === 'function') {
		return parent.create_localized();
	} else {
		// We need to do a proxy create.
		var proxy_data = {};
		var white_out = {};
		// we have to use Proxy because we may have had to use node-proxy.
		var new_proxy = Proxy.create({
										getOwnPropertyDescriptor: function(name) {
											var desc;
											if (proxy_data[name] !== undefined) {
												desc = Object.getOwnPropertyDescriptor(proxy_data, name);
											} else {
												desc = Object.getOwnPropertyDescriptor(parent, name);
											}
											if (desc !== undefined) {
												desc.configurable = true;
											}
											return desc;
										},
										getPropertyDescriptor: function(name) {											
											var desc;
											if (proxy_data[name] !== undefined) {
												desc = Object.getPropertyDescriptor(proxy_data, name);
											} else {
												desc = Object.getPropertyDescriptor(parent, name);
											}
											if (desc !== undefined) {
												desc.configurable = true;
											}
											return desc;
										},
										getOwnPropertyNames: function() {
											var keys = { "_get_only_localized_data": 1 }; // hide the 'what changed' function 
											
											var all_keys = Object.getOwnPropertyNames(parent).concat(Object.getOwnPropertyNames(proxy_data));
											var keys_to_return = [];
											var total_keys = all_keys.length;
											
											for (var i = 0; i < total_keys; i++) {
												if (keys[all_keys[i]] === undefined && white_out[all_keys[i]] != 1) {
													keys_to_return.push(all_keys[i]);
													keys[all_keys[i]] = 1;
												}
											}
											
											return keys_to_return;
										},
										getPropertyNames: function() {

											var keys = { "_get_only_localized_data": 1 }; // hide the 'what changed' function
											var all_keys = Object.getPropertyNames(parent).concat(Object.getPropertyNames(proxy_data));
											var keys_to_return = [];
											var total_keys = all_keys.length;
							
											// we have to build up the keys based on the parent object AND the localized data
											// so we have to look at both, and then look at the white_out array.
											for (var i = 0; i < total_keys; i++) {
												if (keys[all_keys[i]] === undefined && white_out[all_keys[i]] != 1) {
													keys_to_return.push(all_keys[i]);
													keys[all_keys[i]] = 1;
												}
											}
											return keys_to_return;
										},
										defineProperty: function(name, desc) {
											Object.defineProperty(proxy_data, name, desc);
										},
										delete: function(name) {
											// if we delete from the proxy, we need to hide the contents of the parent.
											// so we need some white out.
											white_out[name] = 1;
											return delete proxy_data[name];
										},
										fix: function() {
											// check this - not sure I got this right.
											var result = {};
											if (Object.is_frozen(proxy_data)) {
												var proxy_keys = Object.getOwnPropertyNames(proxy_data);
												var parent_keys = Object.getOwnPropertyNames(parent);
												for (var i = 0; i < proxy_keys.length; i++) {
													if (result[proxy_keys[i]] === undefined && white_out[proxy_keys[i]] != 1) {
														result[proxy_keys[i]] = Object.getOwnPropertyDescriptor(proxy_data, proxy_keys[i]);
													}
												}
												for (var i = 0; i < parent_keys.length; i++) {
													if (result[parent_keys[i]] === undefined && white_out[parent_keys[i]] != 1) {
														result[parent_keys[i]] = Object.getOwnPropertyDescriptor(parent, parent_keys[i]);
													}
												}
												return result;
											} else {
												return undefined;
											}
										},
										get: function(proxy, name) {
											//console.log('looking for attribute: ' + name);
											
											if (white_out.hasOwnProperty(name)) {
												//console.log('returning whiteout: ' + name + ".");
												return undefined;
											} else if (proxy_data[name] !== undefined) {
												//console.log('returning ' + name + ".");
												
												return proxy_data[name];
											} else {
												var val;
												
												if (typeof parent[name] === 'object') {
													val = iz.localize(parent[name]);
													proxy_data[name] = val;
												} else {
													val = parent[name];
												}
												//console.log('returning ' + name + " : " + typeof val);
												return val;
											}
										},
										set: function(proxy, name, val) {
											proxy_data[name] = val;
											if (white_out[name]) {
												delete white_out[name];
											}
										}			
									 });
									 
		new_proxy['_get_only_localized_data'] = function() {
		  var out = {};
		  var proxy_keys = Object.keys(proxy_data);
		  for (var i = 0; i < proxy_keys.length; i++) {
              var attr = proxy_keys[i];
              if (attr == '_get_only_localized_data') {
                  continue;
              }
              if (typeof proxy_data[attr] === 'object' && typeof proxy_data[attr]['_get_only_localized_data'] === 'function') {
                  out[attr] = proxy_data[attr]._get_only_localized_data();
              } else {
                  out[attr] = proxy_data[attr];
              }
              
		  }
		  var whiteout_keys = Object.keys(white_out);
  		  for (var i = 0; i < whiteout_keys.length; i++) {
                var attr = whiteout_keys[i];
                out[attr] = undefined;
  		  }
  		  return out;
		};
		
		return new_proxy;
	}
	
}

// TODO: Create a Proxy that hides the fact that accessors are, well, accessors, so that they look more like
// Object keys.  This would be an experimental feature, but it sure would be nice. :-)


// create_localized is an unusual beastie. It really only needs a little additional behavior from new_object
// so new_object adds this in when called with a 'localize me' object as the second parameter.  
proto.create_localized = function () {
	return this.new_object(undefined, this);
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