/*
file: iz.js

Class: IZ Object System 
    
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

Example: 
(code)
    var Parrot = iz.Use('Animal.Bird.Parrot');
    var myparrot = new Parrot({ mimic : 'duck' });
    myparrot.makesound(); // quack!
    myparrot.mimic('cow');
    myparrot.makesound(); // moo!
(end)

Note that while we use the term 'Class' frequently in this documentation, it is
important to know that Javascript has no notion of a Class or Class namespace. IZ 
borrows the term and nomenclature for familiarity and ease of understanding only. IZ 
uses prototypical inheritance and uses 'Class names' only as a mechanism for naming and
retrieving prototypes.  

For more information on Javascript's prototypical inheritance (and many other goodies), 
please refer to Douglas Crockford's excellent book, 'Javascript: The Good Parts.'

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
    tetchy: false,
    calc_tag: undefined,
    object_tagging: false,
    auto_debug: false
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
    
    // if we are being given undefined and required is not set on the field, we let it pass
    if (details['required'] !== true && value === undefined) {
        ok = true;
    } else {
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
    }
    return ok;
}

// iz_require is used internally to load dependencies. 
function iz_require(path, packagename, callback) {
    // if we have a 'require' we use it, assuming the system knows what it's doing.
    // most of the time, this is node and it's all good.
    if (typeof require === 'function') {
        require(path);
        var module = iz.Module(packagename);
        if (callback && typeof callback === 'function') {
            callback(module);
        }
        return module;
    } else if (process === undefined && document !== undefined) {
        // pre-release attempt at loading dynamically.  Not supported.  Not remotely.
        // if you find this and try to use it, you're on your own.  Give us a better way 
        // that's reliable.
            var script=document.createElement('script');
            script.setAttribute("type","text/javascript");
            script.setAttribute("src", path);
            document.getElementsByTagName("head")[0].appendChild(script);
    } else {
        throw new Error("Unable to load js file - No require(). How do I do it?");
    }
}


/*
Group: Class definition methods

method: iz.Package(classname, inheritance, class_function)
    
Creates a new package and registers it's namespace. 

The function in the iz.Package() call is used to create a _prototype_ object for
the given class. The Class object passed to the function will have all the
inheritance and mixin behavior already added  and will be ready for your own
definitions. This allows you to override any inherited behavior within your
class definition.  It is vital that you remember to return the Class at the end
of the function.  This is used as the prototype for all objects created using
this class.   As such, you should avoid doing anything that creates state within
the closure, as this state would be shared by ALL instances of this class.

Inheritance can be defined using two mechanisms.  First, 'extends', provides a
base class for the class to be created.  This can be an IZ classname, a function
or another object.  This will be used as the prototype for  objects of this
class.  Note that when providing a function to extends, node's util.inherits()
is used to accomplish the  inheritance.  The second mechanism for inheritance is
the mixin.  While only a single item may be specified for 'extends', multiple
mixins may be specified using an array.  You can provide an IZ class name or an
object as a mixin.  Note that you may use 'extends' and 'mixin' on the same 
class in the same iz.Package definition. 

Note also that in the case where you are not inheriting anything, you can omit
the inheritance argument altogether.

Parameters:

    classname - Namespace of class to be created
    inheritance - Object containing inheritance details
    class_function - Function reference containing the body of the class to be created.

Returns: 

    Class creation function

Example:
(start code)
iz.Package( 'MyAwesomeClass', 
              {
                   extends: 'MyOtherClass',
                   mixin: [ 'Classname', my_useful_object ]
              }, 

              // Class is passed in and Class must be returned.
              function (Class) { 
                    // add things to Class

                    // it's very important to return Class;
                    return Class;
              });
(end)



*/
iz.Package = function (packagename, inheritance, closure) {
    var Class;
    var Superclass;
    var F;
    
    if (typeof inheritance === 'function') {
        closure = inheritance;
        inheritance = {};
    }
    
    //console.log('iz.Package loading ' + packagename);
    // process inheritance.
    if (inheritance['extends'] !== undefined) {
        // if we are extending with an object, we have to do some interesting stuff.
        // basically we have to invert our inheritance... we inherit from the object provided
        // and then mixin our IZ methods.  We do this because we don't know if doing a mixin 
        // from the base object will behave correctly.  We know the iz prototype methods will still
        // function properly when mixed in.
        if (typeof inheritance['extends'] == 'object' || typeof inheritance['extends'] == 'function') {
            F = function () {};
            if (typeof inheritance['extends'] == 'function') {
                //console.log('inheriting using util.inherits');
                util.inherits(F, inheritance['extends']);
                //F.prototype = inheritance['extends'];                
            } else {
                F.prototype = inheritance['extends'];
            }
            Class = new F();
            var baseIZObj = IZ.prototype;
            Class = iz.mixin(Class,baseIZObj);
            Class['_'] = {
                attributes: {}
            };
            Class._['ISA'] = [packagename];
            if (!iz.can(Class, 'super')) {
                Class['super'] = function (name) {
                    var method = F.prototype[name];
                    if (name !== undefined) {
                        if (typeof(method) === 'function') {
                            return function () {
                                return method.apply(this, arguments);
                            }.bind(this);
                        } else {
                            // if it's not a function, return it.  
                            // this also handles the case where method is actually undefined.
                            return method;
                        }
                    } else {
                        return this.__proto__;
                    }
                };
            }
        } else {

            // We want to inherit from the main base class - we need an object to inherit from. We ask
            // for the package's base_class();
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
                Class = new F();
                Class['_'] = {
                    attributes: {}
                };
                if (F.prototype._!== undefined && typeof F.prototype._['ISA'] === 'object') {
                    Class._['ISA'] = [packagename].concat(F.prototype._['ISA']);
                    iz_merge_meta_attributes(Class._, F.prototype._);
                } else {
                    Class._['ISA'] = [packagename];
                }
                Class['super'] = function (name) {
                    var method = F.prototype[name];
                    if (name !== undefined) {
                        if (typeof(method) === 'function') {
                            return function () {
                                return method.apply(this, arguments);
                            }.bind(this);
                        } else {
                            // if it's not a function, return it.  
                            // this also handles the case where method is actually undefined.
                            return method;
                        }
                    } else {
                        return this.__proto__;
                    }
                };
            } else {
                throw new Error("ModuleError: " + inheritance['extends'] + " not defined");
            }
        }

    } else {
        Class = new IZ();
        Class['_'] = {
            attributes: {}
        };
        Class._['ISA'] = [packagename];
        // super on a base class does nothing.  
        Class['super'] = function (name) {
            var method = IZ.prototype[name];
            if (typeof(method) === 'function') {
                return function () {
                    return method.apply(this, arguments);
                }.bind(this);
            } else {
                // if it's not a function, return it.  
                // this also handles the case where method is actually undefined.
                return method;
            }
        };
    }
    
    Class._['does'] = {};
    Class._['classname'] = packagename;

    if (inheritance['mixin'] !== undefined) {
        if (typeof inheritance['mixin'] === 'array') {
            var mixin_obj;
            for (mixin_obj in inheritance['mixin']) {
                Class.mixin(mixin_obj);
            }
        } else {
            Class.mixin(inheritance['mixin']);
        }
    }
    
    var CONS = function () {
        var result = closure(Class);
        if (result === undefined) {
            throw new Error("ModuleError: " + packagename + " doesn't return anything! Can't create class.");
        } else {
            return result;
        }
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
method: Class.has(attributename, definition)

Defines a new object attribute.

Parameters:    
attribute - Attribute name to add
definition - Attribute definition object literal

Attribute Definition:

The definition provides information about the attribute.  The available options
are:

    isa - defines a type requirement for this element.   valid options are:
    boolean, number, string, function, array, object and classname (iz class
    name)
            
    readonly - Sets attribute to be read-only (true/false) Read only values can
    only be set in the new() call.  All other     attempts to set a value will
    fail.
             
    builder - function to be used to get a default value.  '*this*' will be the
    object the builder is being called on, and   the first argument will be the
    field name the builder is being called on.  called as:
    this.builder(fieldname)   Should return the value to be used.

    default - provides a default value for the field if none is provided during
    the new() call. Note that the default will    be shared by all instances of
    the class, and thus only simple types should use default.  To set defaults
    on    complex attributes (objects, arrays, etc.) should use a builder.
    
    check_value - function that is used to override the type checking with
    custom behavior.  Called with attribute details   as first argument,
    attribute name as second and value as the third.     Called as:
    this.check_value(attribute_details, fieldname, value)

    private - boolean indicating that this attribute is private. accessors for
    private attributes are not added to the final object.  See the example
    below for how to use private attributes.


*Note* that the builder / default values are not set until the value is
requested, not at object creation.  This can have  unexpected results if your
builder routine is time-sensitive (and might be a good reason to create an init-
type method instead).

Returns:
    accessor function for this attribute (not bound to this) Unless you are dealing
    with private attributes, it is safe to ignore the return value of has();


Example:

(start code)
 // within Package definition
 Class.has('friends', {
                        isa: 'array',
                        builder: function (name) {
                                                    // create an array if we didn't get one.
                                                    return new Array(); 
                                                 }
                        
                    })

(end)

As mentioned above, it is possible to create private attributes that are  only
accessible by class methods. The mechanism for doing this is straightforward, if
somewhat non-intuitive. The *has* operator returns the accessor function for the
given attribute.  Using this along with javascript's bind() bind routine allows
you to tie the method to the given instance.  A code example will make this
clearer:

(start code)
// within the Package definition

// this creates an age attribute, but you can not call object.age() as the accessor is never added.
var age_prv = Class.has('age', { isa: 'number', private: true });

Class.do_something_with_age = function(new_age) {

    // this gets us an accessor for age that we can work with.
    // note that this must be done in each method that needs access to age, as it must be bound to this
    var age = age_prv.bind(this);

    // this sets age.
    age(new_age);
}
(end)
*/

proto.has = function (name, detail) {
    
    var accessor;
    
    // this will localize the meta if we need to.  This ensures that if we are making instance changes
    // to the meta hierarchy we don't break our parent classes.
    this._localize_meta();
    
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
        var options = [ 'default', 'readonly', 'builder', 'check_value', 'required', 'isa', 'private' ];
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

    if (this._.attributes[name]['readonly']) {
        accessor = function () {
            if (arguments.length >= 1) {
                throw new Error("Attempt to change value of read-only attribute '" + name + "' on class " + this._.classname);
            }
            return this['_attribute_value'](name);
        };
    } else {
        accessor = function (value) {
            if (arguments.length === 1) {
                return this['_attribute_value'](name, value);
            } else {
                return this['_attribute_value'](name);
            }
        };
    }
    this._.attributes[name]['accessor'] = accessor;
    // if the instance variable is public, we attach the accessor to the object.  If it's private
    // it is only accessible via the function returned from the has function.
    if (!detail['private']) {
        this[name] = accessor;
    }
    return accessor;
};




/*
method: Class.mixin(class_or_object, overlay_attributes)

Adds the functionality of the given class to Class by copying all the methods and 
attributes of the provided class onto the current object.  Mixins allow you to 
merge multiple objects or clases together. 

This can be especially useful when you want to create functionality that
would apply to many different types or classes of object. Creating a class
intended to be mixed in will allow you to add that functionality to any object
regardless of it's inheritance structure. In IZ mixins can be applied at
the class level or at the instance level, allowing run-time addition of 
defined functionality.

Parameters:    
    class_or_object - Class or Object to mix in

Returns:
    The original object.

Example:

(start code)
// do.stuff is a subclass of thingdoer
iz.package('do.stuff', { extends: 'thingdoer' }, function (Class) {
       
       // Also, a duck.
       Class.mixin('Duck');

       Class.do_things = function () {
           console.log('doing things!  also: ' + Class.quack() );
       };
       return Class;
   });
(end)
- OR - 
(start code)
    var stuffdoer = new iz.Module('do.stuff')();
    // mix in OtherThings into this instance only 
    stuffdoer.mixin('OtherThings');
(end)

Note that an optional overlay_attributes parameter can be added to specify the
specific attributes to copy.  This parameter is  an array of attributes to be
copied from the source object. Great care should be taken if you  provide this
as many methods have expectations about what is available on the object they are
attached to. Therefore this second parameter should only be used when you are
intimately familiar with the package in question.

If you are creating classes to be included via the *mixin* mechanism, you can
control what attributes  are mixed in from your class.  You do this by adding an
attribute called 'overlay_attributes' to your object or class.  Within this
attribute, place an array containing the list of attribute names you want to
have mixed-in to the recipient class or object.  Only those attributes 
specified will be mixed-in.

*/

proto.mixin = function(mixin_class, overlay_attributes) {
    return iz.mixin(this, mixin_class, overlay_attributes);
};

iz.mixin = function (obj, mixin_class, overlay_attributes) {
    var mixin_source;
    var root_object = Object;
    var attr, i;

    if (typeof mixin_class === 'object') {
        mixin_source = mixin_class;
    } else {
        mixin_source = iz.Module(mixin_class).base_class();
    }
    
    // if we are operating in an iz object we may need to localize the meta
    // this makes sure that if we are mixing in to an instance, we don't break our base class's meta information
    if (iz.can(obj, '_localize_meta')) {
        obj._localize_meta();
    }

    if (mixin_source !== undefined) {
        if (typeof mixin_class === 'string' && obj._ !== undefined && obj._.does !== undefined) {
            obj._.does[mixin_class] = 1;
        }
        if (overlay_attributes === undefined) {
            if (mixin_source.hasOwnProperty('overlay_attributes')) {
                overlay_attributes = mixin_source.overlay_attributes;
            } else {
                overlay_attributes = [];
                for (attr in mixin_source) {
                    //console.log('Looking at Attribute: ' + attr);
                    
                    if (typeof root_object.prototype[attr] === "undefined" && ((typeof mixin_class === 'object' && obj['_'] === undefined) || typeof IZ.prototype[attr] === "undefined")) {
                        //console.log('Adding in Attribute: ' + attr);
                        overlay_attributes.push(attr);
                    }
                }
            }
        }
        
        //console.log("Mixin was: " + util.inspect(mixin_source));

        for (i = 0; i < overlay_attributes.length; i++) {
            attr = overlay_attributes[i];
            // don't copy meta wholesale... that makes the class very confused about itself.  Also, don't overwrite things that already exist in the actual object.
            if (attr !== '_' && !obj.hasOwnProperty(attr)) {
                // copy any attribute metadata if we have it.
                if (mixin_source._ !== undefined && typeof mixin_source._['attributes'] === 'object' && mixin_source._.attributes[attr]) {
                    obj._.attributes[attr] = mixin_source._.attributes[attr];
                }
                obj[attr] = mixin_source[attr];
            }
        }
    }
    return obj;
};


/*
Group: IZ utility routines

method: iz.Use(classname) 

Ensures that classname is loaded and available to be used.  

Use will load the class if it has not been loaded before, otherwise it
uses the class that has already been loaded. After loading, you can instantiate:

(code)
  iz.Use('My.Module');
  var mymodule = new iz.Module('My.Module');
(end)

Under node.js, this will load the class using require().  Note that when the
module has already been loaded, it will not be reloaded and iz.Use() will instead
behave like iz.Module() in these cases.  Note also that while iz.Use() does not
currently load files in the browser environment, you may use IZ in the browser if 
you preload your dependencies. (we are open to ideas to reliably accomplish in-browser 
loading)

Class naming and filenames:

Class names are separated by periods '.' representing containing
namespace.  When the object is being loaded with 'Use' this namespace
is translated to a path.  Each class component preceeding a . is
treated as a directory.  For example, to load
'MyApp.Animals.MegaDuck', iz would treat the file to be loaded as
'MyApp/Animals/MegaDuck.js'

Parameters:
    classname - Class to be loaded
    
Returns
    nothing

(start code)
    var MegaDuckClass = iz.Use('My.Animals.MegaDuck');
(end)

*/
iz.Use = function (packagename, callback) {
    if (prv.loaded_packages[packagename] !== undefined) {
        return iz.Module(packagename);
    }
    //console.log(packagename);

    var path = packagename.replace(/\./g, '/');

    return iz_require(path, packagename, callback);
};



/* 
method: iz.Tetchy(true_or_false)

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

// Create a calc_tag function we can use to tag an object when tagging is enabled.

try {
    prv.calc_tag = require('node-uuid').v1;
} catch(e) {
    var crypto = require('crypto');
    prv.calc_tag = function() {
        return crypto.randomBytes(32).toString('hex');
    }
};

proto.get_iz_object_tag = function(force) {
    if (this.__obj_tag === undefined && (force === true || prv.object_tagging === true)){
        this.__obj_tag = prv.calc_tag();    
    }
    return this.__obj_tag;
}

iz.object_tagging = function(value) {

    if (value !== undefined) {
        if (value === true) {
            prv.object_tagging = true;
        } else {
            prv.object_tagging = false
        }
    }

    return prv.object_tagging;
}

iz.auto_debug = function(value) {

    if (value !== undefined) {
        if (value === true) {
            prv.auto_debug = console.log;
        } else if (typeof value === 'function') {
            prv.auto_debug = value;
        } else {
            prv.auto_debug = false;
        }
    }

    return prv.auto_debug;
}

iz.bind_cb = function (obj, name, func, debug) {
    
    if (typeof name === 'function') {
        // this means we didn't get a name, and just a function.
        // shift all the args down by one.
        debug = func;
        func = name;
        name = 'unknown';
    }
    
    // return a bound function right away if we aren't in debug mode.
    if ((debug === false || debug === undefined) && prv.auto_debug == false) {
        return func.bind(obj);
    } else {
        
        
        // here either we have debug = true
        if (typeof debug !== 'function') {
            if (typeof prv.auto_debug === 'function') {
                debug = prv.auto_debug;
            } else {
                debug = console.log;
            }
        }
        return function() {
            var object_tag = obj.get_iz_object_tag();
            if (object_tag !== undefined) {
                debug('function ' + name + ' called for object ' + object_tag);                
            } else {
                debug('function ' + name + ' called');
            }
            return func.apply(obj, arguments);
        };
    }
} 

proto.bind_cb = function(name, func, debug) {
    return iz.bind_cb(this, name, func, debug);
}

/* 
method: iz.Module(classname)

Returns the class with the name provided. 

Almost always used with a preceeding 'new'. (See Example)

Parameters:
    classname - Name of the class to obtain.
    NEW: classname should be sent through .Use function first either directly or indirectly through other means (iz.Package, etc)
    
Returns:
    Prototype Function for the class provided.
    
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

proto._localize_meta = function() {
    var attr;
    var supermeta;
    var newmeta;
    
    if (this.hasOwnProperty('_')) {
        // we already have a local copy.  don't do anything.  This also handles where 
        // we are operating inside a base class already
        return;
    } else {
        //console.log('we need to have our own metadata');
        
        // we need to get ahold of the prototype meta. 
        supermeta = this.__proto__._;
        
        // two options - 1) we have localize, so we can actually localize, 2) we clone the meta.
        if (typeof Proxy !== 'undefined') {
            newmeta = iz.localize(supermeta);
        } else {
            newmeta = {
                ISA: supermeta.ISA.slice(0),
                classname: supermeta.classname,
                does: {},
                attributes: {}
            };
            for (attr in supermeta.does) {
                newmeta.does[attr] = supermeta.does[attr];
            }
            for (attr in supermeta.attributes) {
                newmeta.attributes[attr] = supermeta.attributes[attr];
            }
        }
        this._ = newmeta
    }
};

/* 
method: proto.new_object(args)

Creates a new instance of the package class.  
  
Note: This method should not be called directly, instead use the new operator.  
Refer to the example for proper way to create an instance of a class.

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
    
    // cause generation of object tag if tagging enabled;
    self.get_iz_object_tag();
    
    self['_has_been_set'] = function (arg) {
        return (has_been_set[arg] === 1);
    };
    
    // These functions are added to each object.  They are closures which
    // encapsulate the private variables, which make the real variables not accessible.
    self['_attribute_value'] = function (name, value) {
        var val;
        
        if (arguments.length == 2) {
            if (this._.attributes[name].check_value.call(this, this._.attributes[name], name, value)) {
                private_vars[name] = value;
                has_been_set[name] = 1;
            }
        }
        
        if (!this['_has_been_set'](name)) {
            // are we localized?  if so, do we have a value from the parent? if so, get it.
            // we have to check _has_been_set - because we don't want to trigger defaulting
            // on our parent object.  The defaulting should happen on our current object.
            // also, we need to localize any objects we get back.... to make deep localization work.
            // Ok... I need a beer.
            if (object_to_localize !== undefined && object_to_localize['_has_been_set'](name)) {
                val = object_to_localize[name]();
                if (typeof val === 'object') {
                    private_vars[name] = iz.localize(val);
                    has_been_set[name] = 1;
                } else {
                    return val;
                }
            } else {
                val = this.get_default(name);
                if (val !== undefined) {
                    private_vars[name] = val;
                }
                has_been_set[name] = 1;
            }
        }
        return private_vars[name];
    };
    
    if (object_to_localize !== undefined) {
        // This should return only data that is changed in the localized copy.  
        self['___get_only_localized_data'] = function() {
            var attr;
            var out = {};
            for (attr in this._.attributes) {
                if (private_vars[attr] !== undefined) {
                    out[attr] = this[attr]();
                    if (typeof out[attr] === 'object' && typeof out[attr]['___get_only_localized_data'] === 'function') {
                        out[attr] = out[attr].___get_only_localized_data();
                    } 
                }
            }
            return out;
        };
    }
    
    if (typeof(self.CONSTRUCT) === 'function') {
        // if we have a constructor routine, we call it.  We should always have one
        // but you never know.
        return self.CONSTRUCT(args, object_to_localize);
    } else {
        return self;        
    }

};

/*
Function: iz.get_metadata(obj)

Inspects an object and returns information about it. Things that
should not be modified directly are localized.

Parameters:
    obj - an IZ class.

Returns:
    A javascript object containing attributes for 'classname', 'does' and 'attributes' which
    describe the class's structure.

*/
iz.get_metadata = function(obj) {
    if (iz.can(obj, '_get_metadata')) {
        return obj._get_metadata();
    } else if (iz.can(obj, '_iz_classname')) {
        // This means we have an iz class and we can inspect it.
        var meta = {
            classname: obj._.classname,
            does: obj._.does,
            attributes: obj._.attributes
        };
        return iz.localize(meta);
    }
}

// this is not intended to be used outside of iz. Use isa or get_metadata if you need this information.
proto._iz_classname = function() {
    return this._.classname;
};

/*
Group: Object instance methods

method: obj.does(classname)

Introspection routine, returns true if obj can do what classname does.  This checks both for subclassing as well as mixins.

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
    } else {
        // now we need to check the parent in the hierarchy:
        var sup = this.super();
        if (typeof sup === 'object' && sup.can('does')) {
            return sup.does(packagename);
        }
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
    if (packagename !== undefined) {
        for (i = 0; i < this._['ISA'].length; i++) {
            if (this._['ISA'][i] === packagename) {
                return true;
            }
        }
        // if we get here, we didn't find it.
        return false;
    } else {
        return this._.classname;
    }
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
    return (typeof obj === 'object' && typeof obj[methodname] === 'function');
}

iz.get_localized_changes = function(obj) {
    if (iz.can(obj,'___get_only_localized_data')) {
        return obj.___get_only_localized_data();
    } else {
        return {};
    }
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
    
    if (args) {
        var attr;
        for (attr in args) {
            // If we have an accessor function for the attribute provided, we call it. 
            // note that this allows running any method with the arguments provided, during initialization.
            if (typeof this[attr] === 'function') {
                if (!this._.attributes[attr]['readonly']) {
                    this[attr](args[attr]);                                        
                } else {
                    // if it's ro, we need to call the set routine directly, as the accessor is read-only
                    // this is only allowed during initial object creation
                    this['_attribute_value'](attr, args[attr]);
                }
            }
        }
    }
    if (this['_on_object_create'] !== undefined && typeof this['_on_object_create'] === 'function') {
        this._on_object_create(args);
    }

    return this;
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
                                            //console.log('proxy.getOwnPropertyDescriptor called with ' + name );
                                            var desc;
                                            if (proxy_data.hasOwnProperty(name) || white_out.hasOwnProperty(name)) {
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
                                            //console.log('proxy.getPropertyDescriptor called with ' +name);
                                            var desc;
                                            if (proxy_data.hasOwnProperty(name) || white_out.hasOwnProperty(name)) {
                                                desc = Object.getOwnPropertyDescriptor(proxy_data, name);
                                            } else {
                                                desc = Object.getOwnPropertyDescriptor(parent, name);
                                            }
                                            if (desc !== undefined) {
                                                desc.configurable = true;
                                            }
                                            return desc;
                                        },
                                        getOwnPropertyNames: function() {
                                            //console.log('proxy.getOwnPropertyNames called');
                                            var keys = { "___get_only_localized_data": 1 }; // hide the 'what changed' function 
                                            
                                            var all_keys = Object.getOwnPropertyNames(parent).concat(Object.getOwnPropertyNames(proxy_data));
                                            var keys_to_return = [];
                                            var total_keys = all_keys.length;
                                            
                                            for (var i = 0; i < total_keys; i++) {
                                                if (keys[all_keys[i]] === undefined && white_out.hasOwnProperty(all_keys[i]) !== true) {
                                                    keys_to_return.push(all_keys[i]);
                                                    keys[all_keys[i]] = 1;
                                                }
                                            }
                                            //console.log('returned ' + keys_to_return.join(':'));
                                            
                                            return keys_to_return;
                                        },
                                        getPropertyNames: function() {
                                            //console.log('proxy.getPropertyNames called');
                                            var keys = { "___get_only_localized_data": 1 }; // hide the 'what changed' function
                                            var all_keys = Object.getOwnPropertyNames(parent).concat(Object.getOwnPropertyNames(proxy_data));
                                            var keys_to_return = [];
                                            var total_keys = all_keys.length;
                            
                                            // we have to build up the keys based on the parent object AND the localized data
                                            // so we have to look at both, and then look at the white_out array.
                                            for (var i = 0; i < total_keys; i++) {
                                                if (keys[all_keys[i]] === undefined && white_out.hasOwnProperty(all_keys[i]) !== true) {
                                                    keys_to_return.push(all_keys[i]);
                                                    keys[all_keys[i]] = 1;
                                                }
                                            }
                                            return keys_to_return;
                                        },
                                        defineProperty: function(name, desc) {
                                            //console.log('proxy.defineProperty called');
                                            
                                            Object.defineProperty(proxy_data, name, desc);
                                        },
                                        delete: function(name) {
                                            //console.log('proxy.delete called');
                                            
                                            // if we delete from the proxy, we need to hide the contents of the parent.
                                            // so we need some white out.
                                            white_out[name] = 1;
                                            return delete proxy_data[name];
                                        },
                                        fix: function() {
                                            //console.log('proxy.fix called');
                                            
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
                                            //console.log('proxy.get called');
                                            
                                            if (white_out.hasOwnProperty(name)) {
                                                return undefined;
                                            } else if (proxy_data.hasOwnProperty(name)) {
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
                                            //console.log('proxy.set called');
                                            
                                            proxy_data[name] = val;
                                            if (white_out[name]) {
                                                delete white_out[name];
                                            }
                                        }           
                                     });
                                     
        new_proxy['___get_only_localized_data'] = function() {
          var out = {};
          var proxy_keys = Object.keys(proxy_data);
          for (var i = 0; i < proxy_keys.length; i++) {
              var attr = proxy_keys[i];
              if (attr == '___get_only_localized_data') {
                  continue;
              }
              if (typeof proxy_data[attr] === 'object' && typeof proxy_data[attr]['___get_only_localized_data'] === 'function') {
                  out[attr] = proxy_data[attr].___get_only_localized_data();
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