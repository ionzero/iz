var foo = require('iz');
var iz = require('iz');

global.tests = 0;
global.passed = 0;
    function test(string, val) {
        global.tests++;
        var result= "** FAIL **";
        if (val) {
            result = "ok";
            global.passed++;
        }
        console.log( string + ': ' + result);
    }
    
    test('iz.use callable', iz.use('Animals.EvilDuck'));

    iz.package('do.stuff', function (root_object) {
        var self = root_object;

        self.do_things = function() {
            console.log('doing_things!');
            return 'doing things';
        };
        return self;
    });
        
    test('iz.package creates module', typeof iz.loaded_packages['do.stuff'] === 'object');
    
    var dostuff = iz.module('do.stuff').new();
    
    test("created package contains appropriate methods", typeof dostuff['do_things'] === 'function');
    test("created package contains inherited methods", typeof dostuff['can'] === 'function');
    test("created package doesn't contains invalid methods", typeof dostuff['figgle'] !== 'function'); 
    
    iz.package('do.more', { extends: 'do.stuff' }, function (root_object) {
        var self = root_object;
        self.has('name', { builder: function(meta) { return 'william'; },
                           isa: 'string' });

        self.do_more = function() {
            console.log('doing more for ' + this.name());
            return('doing more');
        };
        return self;
    });
    
    var domore = iz.module('do.more').new();
    test('iz.extends superclass methods are visible', typeof domore['do_things'] === 'function');
    test('iz.extends superclass methods are callable', domore.do_things() == 'doing things');
    test('object.can() can see methods from superclasses', domore.can('do_things'));
    domore['do_things'] = function() { console.log("Foo!"); return 'other stuff'; };
    test('subclass methods can override superclass', domore.do_things() == 'other stuff');
    test('access to super from subclass works', domore.super('do_things')() == 'doing things');
    console.log(domore.super('do_things')());
    
    
    iz.package('do.other', { with: 'do.more' }, function (root_object) {
        var self = root_object;
        self.has({ num: { isa: 'number', 'default': 22} });
        self.do_other = function() {
            console.log('doing other!');
            return('doing other');
        };
        return self;
    });
    
    var doother = iz.module('do.other').new();
    
    test('iz.with extends object', typeof doother['do_things'] === 'function' &&
                                   typeof doother['do_more'] === 'function');
    //test('iz.with includes accessors', typeof doother['name'] === 'function');
    test('iz.can recognizes with-derived functions ', doother.can('name'));
    test('iz.with accessors are accessible', doother.name() === 'william');
    
    doother.has('other', { isa: 'string', default: 'something else'});
    
    test('Can add an attribute after object creation', typeof doother['other'] === 'function');
    test('post-new added attributes work', doother.other() == 'something else');
    doother.other('bob');
    test('post-new added attributes can be set', doother.other() == 'bob');
    
    doother.has('something', { default: "it is something" });
    test('Can add an attribute with no type', typeof doother['something'] === 'function');
    test('Default on Attribute with no type', doother.something() == 'it is something');
    doother.something(5);
    test('Default on Attribute with no type can be set to a different type', doother.something() == 5);
    
    
        
   iz.package('do.another', function (root_object) {
       var self = root_object;
       self.with('do.more');

       self.has( {
           num: { isa: 'number', 'default': 17},
           str: { isa: 'string', 'default': 'bob'}
       });
       self.do_another = function() {
           console.log('doing another!')
           return('doing another');
       };
       return self;
   });
   
   
   
   
   var doanother = iz.module('do.another').new();
   
    test('iz.with in package prototype works', (typeof doanother['do_things'] === 'function' &&
        typeof doanother['do_more'] === 'function'));
    test('do_another works', doanother.do_another() == 'doing another');
    test('has with multiple attributes works', typeof doanother['num'] === 'function' && 
                                                typeof doanother['str'] === 'function');
    test('defaults on has work', doanother.num() == 17);

      
    var third = iz.module('do.more').new();
    third.name('John');
    var fourths = iz.module('do.more').new();
    test('no bleedover between object attributes', (third.name() !== fourths.name()));
    
        
        function do_stuff() {
            var first = 1;
            var second = 2;
            var third = 3;
            third = first;
            first = second;
            second = iz.module('do.stuff').new();
            thirds = iz.module('do.more').new();
            console.log(thirds.meta.ISA.join(':'));
            var fourth = iz.module('do.more').new();
            thirds.do_more();            
            thirds.name('john');
            thirds.do_more();
            console.log('no bleedover between object attributes', (thirds.name() !== fourth.name()));
            fourth.do_more();
//            third.do_things();
//            var cm = iz.module('iz.CardManager').new();
//            cm.whoami();
        }
        
    console.log( global.passed + " of " + global.tests + " Passed ");
