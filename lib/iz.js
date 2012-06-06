/*
file: iz.js

Class: Ionzero Object System 
	
Overview:

The Ionzero Object System, or *iz*, provides a mechanism for the creation of robust
javascript objects.  Some features are:
    
    - Multi-level inheritance
    - Roles (similar to 'mixins') 
    - object intro-spection
    - simple attribute creation
    - attribute type checking (including user-defined checking)
 */
"use strict";
//var iz = (function() {
var VERSION = "1.1";
var iz = this; //global['_iz'];

/*    if (iz) {
    if (VERSION <= iz['VERSION']) {
        return;
    }

    //Module = iz.constructor;
} else {
    //global['iz'] = iz = new IZ();
     iz = new IZ();
}
//this = iz;
*/
console.log('AIEEEEEEE');
function IZ() {}
var proto = IZ.prototype;
//    var proto = iz.prototype;
//    iz.prototype = proto;
iz.loaded_packages = {};

var js_base = '';
    
function iz_merge_meta_attributes (destination, origin) {
    var attr;
    for (attr in origin.attributes) {
        if (!destination.attributes.hasOwnProperty(attr)) {
            destination.attributes[attr] = origin.attributes[attr];
        }
    }
}

function iz_check_attribute_value(details, name, value) {
    var ok = false;
    if ( details['isa'] !== undefined) {
        if ( typeof value === 'object' ) {
            if (details['isa'] === 'object') {
                ok = true;
            } else if ( details['isa'] === 'array' && value.length) {
                ok = true;
            } else if ( value['does'] !== undefined &&
                        typeof value['does'] === 'function' &&
                        value.does(details['isa']) ) {
                ok = true;
            }
        } else if (typeof value === details['isa'] ) {
            ok = true;
        }
        if (!ok) {
            throw(name + " attribute: trying to use a " + (typeof value) + " in a " + details['isa'] + " field");
        }
    } else {
        ok = true;
    }  
    return ok;
}

proto['VERSION'] = VERSION;
proto['loaded_packages'] = {};


/*
Group: IZ utility routines

method: iz.use(classname) 

Ensures that classname is loaded and available to be used.  Since this loads the class from the remote server, it is likely
that iz.use will return before the javascript is actually loaded by the browser.  It is therefore recommended to avoid using
'use' in reaction to browser events.  

The path to the JS in question is based on a javascript prefix provided via the iz.js_base_url() method.  Each '.' in the 
classname is translated to a '/' in the path, and a '.js' is appended.  This is best illustrated by an example.  
If iz.js_base_url() is '/js/', a class named 'My.Animals.SuperDuck' would load '/js/My/Animals/SuperDuck.js' 

Note that the js is loaded into the head of the current document, so anything contained within the js file will be 
executed immediately.

*EXPERIMENTAL* This mechanism is still experimental.  It's still a better idea to preload the classes you will be using
directly if you know what they are.

Parameters:
    classname - Class to be loaded
    
Returns
    nothing

(start code)
iz.use('My.Animals.SuperDuck');
(end)

*/
iz.use = function(packagename) {
    if (iz.loaded_packages[packagename] !== undefined) {
        return iz.module(packagename);
    }
    console.log(packagename);
    
    var path = packagename.replace(/\./g, '/'); //  + ".js";
    console.log(path);
    
//    require("./" + path);
    require(path);
/*
    var script=document.createElement('script');
    script.setAttribute("type","text/javascript");
    script.setAttribute("src", path);
    document.getElementsByTagName("head")[0].appendChild(script);
*/
	return iz.module(packagename);
};


/*
method: iz.js_base_url(base_url)

Gets or Sets the base URL prefix for iz based JS files.

Parameters:    
    base_url - URL to the base of the javascript hierarchy.
    
Returns:
    Current base URL
    
Example:

(start code)

iz.js_base_url('http://www.server.somewhere.com/js/');

// the following loads: http://www.server.somewhere.com/js/Somewhere/Animals/SuperDuck.js
iz.use('Somewhere.Animals.SuperDuck'); 
(end)

*/

iz.js_base_url = function(base) {
    // this is a redefinable method, so different class hierarchies can be 
    // placed in separate directories?
    if (base !== undefined) {
        js_base = base;
        
        // make sure we end in a slash.
        
        if (js_base.charAt(js_base.length-1) !== '/') {
            js_base = js_base + '/';
        }
    }
    return js_base;
};


/* 
method: iz.module(classname)

Gets the class with the name provided. Almost always used with a new() immediately following.

Parameters:    
    classname - Name of the class to obtain.
    
Returns:
    Prototype object for the class provided.
    
Example:

(start code)
var bad_duck = iz.module('Somewhere.Animals.SuperDuck').new({ disposition: 'evil' });
(end)
    
*/

    iz.module = function(packagename) {
        var root = iz.loaded_packages[packagename];
    
        if (root === undefined) {
            // yes.... we could load it for you... but forget that.  Learn how to program.
            throw("ModuleError: " + packagename + " was not found.  Perhaps you forgot to 'use' it?");
        } else {
            return root;
        }
    };

/* 
method: proto.new(args)

Creates a new instance of the package class.  It is called against the package prototype object. This is
almost always done as a chained method from an iz.module() call.  

Parameters:    
    args - Object literal containing attributes to be set upon object creation.
    
Returns:
    Instance of the prototype class.
    
Example:

(start code)
var good_duck = iz.module('Somewhere.Animals.SuperDuck').new({ disposition: 'good' });
(end)
*/
    proto['new'] =  function(args) {
                    var superclass = this;
                    var F = function() {};
                    F.prototype = superclass;
                    
                    var self =  new F();
                    var private_vars = {};
                    var has_been_set = {};

                    // These functions are added to each object.  They are closures which 
                    // encapsulate the private variables, which make the real variables not accessible.

                    self['get_attribute_value'] = function(name) {
                        if (has_been_set[name] === undefined) {
                            var val = this.get_default(name);
                            if (val !== undefined) {
                                this['set_attribute_value'](name,val);
                            }
                            has_been_set[name] = 1;
                        }
                        return private_vars[name];
                    };

                    // Calling check_value means that you can provide your own checking when you create the attribute.
                    self['set_attribute_value'] = function(name, value) {
                        if (value !== undefined) {
                            if (this.meta.attributes[name].check_value.call(this, this.meta.attributes[name], name, value)) {
                                private_vars[name] = value;
                                has_been_set[name] = 1;
                            }
                        }
                        return this['get_attribute_value'](name);
                    };
                    if (args) {
                        var attr;
                        for (attr in args) {
                            //console.log(attr + ' being initialized');
                            if (typeof self[attr] === 'function') {
                                //console.log(attr + ' being set');
                                self[attr](args[attr]);
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
                   with: [ Some, Other, Classes ]
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
    iz['package'] = function(packagename, inheritance, closure) {
                            var self;
                            if (typeof inheritance === 'function') {
                                closure = inheritance;
                                inheritance = {};
                            } 
                            // process inheritance.
                            if (inheritance['extends']) {
                                if (iz.loaded_packages[inheritance['extends']] === undefined || 
                                    iz.loaded_packages[inheritance['extends']].constructor === undefined) {
                                    // does this belong here?  Should we just yell when you don't do it?  
                                    // I think it's safe for now.... maybe.... 
                                    iz.use(inheritance['extends']);
                                }
                                var Superclass = iz.loaded_packages[inheritance['extends']].constructor;
                                if (Superclass !== undefined) {
                                    var F = function() {};
                                    F.prototype = new Superclass();
                                    self = new F();
                                    self['meta'] = { attributes: {} };
                                    if (F.prototype.meta !== undefined && typeof F.prototype.meta['ISA'] === 'object') {
                                        self.meta['ISA'] = [ packagename ].concat(F.prototype.meta['ISA']);
                                        iz_merge_meta_attributes(self.meta, F.prototype.meta);

                                    } else {
                                        self.meta['ISA'] = [ packagename ];
                                    }
                                    // prototypical access to super (inspired by Javascript: the good parts) 
                                    self['super'] = function (name) {
                                                    var that = self;
                                                    var method = F.prototype[name];
                                                    return function() {
                                                        return method.apply(that, arguments);
                                                    };
                                                };
                                } else {
                                    throw("ModuleError: " + inheritance['extends'] + " not defined, perhaps you forgot to load it?");
                                }
                            } else {
                                self = new IZ();
                                self['meta'] = { attributes: {} };
                                self.meta['ISA'] = [ packagename ];
                                self['super'] = function (name) {
                                    throw("ModuleError: Attempting to call super." + name + " on " + packagename + ", which is a base class");
                                };
                            }
                            self.meta['does'] = {};
                            self.meta['classname'] = packagename;
                            
                            if (inheritance['with'] !== undefined) {
                                if (typeof inheritance['with'] === 'array') {
                                    var with_obj;
                                    for (with_obj in inheritance['with']) {
                                        self.with(with_obj);
                                    }
                                } else {
                                    self.with(inheritance['with']);
                                }
                            }
                            // Look at this later - see if we can return a function that calls self.new() with passed arguments
                            // in the CONS constructor - so that we can do new FooClass({args});
                            var CONS = function() { return closure(self); };
                            iz.loaded_packages[packagename] = new CONS();
                            iz.loaded_packages[packagename].constructor = CONS;
                            return iz.loaded_packages[packagename];
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
                        builder: function(name) {
                                                    // create a duck object if we didn't get one.
                                                    return iz.module('Duck').new();
                                                }
                        
                    })

(end)
*/                        
    proto['has'] = function(name, detail) {
                        //var private = this['_private'];

                        // if we get an object as 'name' then we probably have a list of attributes, we can roll like that.
                        if (typeof name === 'object') {
                            var fieldname;
                            for (fieldname in name) {
                                this.has(fieldname, name[fieldname]);
                            }
                            return;
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
                            this[name] = function() { return this['get_attribute_value'](name); };
                        } else {
                            this[name] = function(value) { return this['set_attribute_value'](name, value); };
                        }
                };




/*
method: self.with(class)

Adds the functionality of the given class to self.  This is similar to Roles in perl or Mixins in other languages.
All the methods and attributes of the package are copied by reference onto the current object.  Note that 
because of this, any changes made to the content of any array or object attributes will affect the original class.  

If you are creating classes to be included via the *with* mechanism, you can provide an 'overlay_attributes' array attribute. 
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
       self.with('Duck');

       self.do_things = function() {
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

    proto['with'] = function(packagename, overlay_attributes) {
                            var superclass = iz.module(packagename);
                            var root_object = Object;
                            var attr, i;
                            

                            if (superclass !== undefined) {
                                this.meta.does[packagename] = 1;
                                if (overlay_attributes === undefined) {
                                    if (superclass.hasOwnProperty('overlay_attributes')) {
                                        overlay_attributes = superclass.overlay_attributes;
                                    } else {
                                        overlay_attributes = [];
                                        for (attr in superclass) {
                                            if ( typeof root_object.prototype[attr] === "undefined" && 
                                                 typeof IZ.prototype[attr] === "undefined" ) {
                                                overlay_attributes.push(attr);
                                            }
                                        }   
                                    }
                                }

                                for (i = 0; i < overlay_attributes.length; i++) {
                                    attr = overlay_attributes[i];
                                    // copy any attribute metadata if we have it.
                                    if (superclass.meta !== undefined && typeof superclass.meta['attributes'] === 'object' && 
                                        superclass.meta.attributes[attr]) {
                                            this.meta.attributes[attr] = superclass.meta.attributes[attr];
                                    }
                                    this[attr] = superclass[attr];
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
    proto['does'] = function(packagename) {
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
    proto['isa'] = function(packagename) {
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
    proto['can'] = function(methodname) {
                      if (typeof this[methodname] === 'function') {
                          return true;
                      } else {
                          return false;
                      }
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
    proto['get_default'] = function(name) {
                               var val;
                               if (typeof this.meta.attributes[name]['builder'] === 'function') {
                                   val = this.meta.attributes[name].builder.call(this,name);
                               } else if (this.meta.attributes[name]['default'] !== undefined) {
                                   val = this.meta.attributes[name]['default'];
                               }
                               return val;
                           };
                
//    return (iz);           
//}(this));

/*
Copyright:
	Copyright (c) 2011 Jason Kuri

License:
	Proprietary - Use is allowed only by express written permission.

Version:
	1.1
*/