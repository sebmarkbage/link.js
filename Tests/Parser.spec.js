if (typeof require !== 'undefined') var parse = require('../Source/Library/link').parse;

describe('Parser', function(){

function bodyOf(fn){
	return fn.toString().match(/function.*{([\s\S]*)}/)[1];
}

describe('globals', function(){
	var sample = bodyOf(function(){
		foo;
		var foo = function named(){};
		bar = 2

		labeled: function bah(){
			var x,z;
			y = (10+z);
		}

		bah = foo;

		exports: var efoo, ebar;

		var someVariable = {
			obj: initializer,
			obj2: function(a,b){
				return function(){
					exports.foobar = '';
					exports.fooz = 2;
					return a / b / c;
				}
				var c;
			}
		}, someOtherVariable

		switch ("x"){
			case "x": {
				exports.nooz = 'zoon';
			}
			default: {
				ebar = bah && /regexp/.test("string")
					? /regexp/ : !/regexp/;
				return"string"
			}
		}

		exports: bar;

		foo();

		exports: function foobar(){
			exports: function shouldNotFindThis(){}
		}
	});

	// Avoid browser dead code elimination
	sample = "foo;\n		var foo = function named(){};\n		bar = 2\n\n		labeled: function bah(){\n			var x,z;\n			y = (10+z);\n		}\n\n		bah = foo;\n\n		exports: var efoo, ebar;\n\n		var someVariable = {\n			obj: initializer,\n			obj2: function(a,b){\n				return function(){\n					exports.foobar = '';\n					exports.fooz = 2;\n					return a / b / c;\n				}\n				var c;\n			}\n		}, someOtherVariable\n\n		switch (\"x\"){\n			case \"x\": {\n				exports.nooz = 'zoon';\n			}\n			default: {\n				ebar = bah && /regexp/.test(\"string\")\n					? /regexp/ : !/regexp/;\n				return\"string\"\n			}\n		}\n\nexports: bar;\n\n		foo();\n\n		exports: function foobar(){\n			exports: function shouldNotFindThis(){}\n		}\n	";

	it('should find all declared global variables', function(){
		var module = parse(sample);
		expect(module.declaredVariables.length).toEqual(3);
	});

	it('should find all declared global functions', function(){
		var module = parse(sample);
		expect(module.declaredFunctions.length).toEqual(1);
	});

	it('should find all undeclared global variables', function(){
		var module = parse(sample);
		console.log(module.expectedVariables);
		expect(module.expectedVariables.length).toEqual(4);
	});

	it('should find all declared exported global variables', function(){
		var module = parse(sample);
		expect(module.exportedVariables.length).toEqual(2);
	});

	it('should find all declared exported global functions', function(){
		var module = parse(sample);
		expect(module.exportedFunctions.length).toEqual(1);
	});

	it('should find all declared exported properties', function(){
		var module = parse(sample);
		expect(module.exportedProperties.length).toEqual(2);
	});

	it('should find all global tokens', function(){
		var module = parse(sample);
		expect(module.tokens.length).toEqual(13 + 3 + 3 + 2 + 2 + 3);
	});
});

describe('requires', function(){

	var sample = bodyOf(function(){
		foo;
		var foo = 1;
		bar = 2;

		require: 'a', "b", 'c'

		labeled: function bah(){
			var x,z;
			y = 10;
		}

		require:
			"c"
			"d";
		"e"

		bah = foo;

		require: exports: var efoo, ebar;

		var someVariable = {
			obj: initializer,
			obj2: function(a,b){
				return a / require('A') / b;
			}
		}, someOtherVariable

		foo();

		exports: function foobar(){
			exports: function shouldNotFindThis(){}
		}

		var hasOwnProperty = require('hasOwnProperty');
		var toString = require('toString');

	});

	sample = "foo;\n		var foo = 1;\n		bar = 2;\n\n		require: 'a', \"b\", 'c'\n\n		labeled: function bah(){\n			var x,z;\n			y = 10;\n		}\n\n		require:\n			\"c\"\n			\"d\";\n		\"e\"\n\n		bah = foo;\n\n		require: exports: var efoo, ebar;\n\n		var someVariable = {\n			obj: initializer,\n			obj2: function(a,b){\n				return a / require('A') / b;\n			}\n		}, someOtherVariable\n\n		foo();\n\n		exports: function foobar(){\n			exports: function shouldNotFindThis(){}\n		}\n\n		var hasOwnProperty = require('hasOwnProperty');\n		var toString = require('toString');\n\n	";

	it('should find all dependencies', function(){
		var module = parse(sample);
		expect(module.requires.length).toEqual(7);
	});

	it('should find all imported dependencies', function(){
		var module = parse(sample);
		expect(module.imports.length).toEqual(4);
	});

});

describe('amd', function(){

	var sample = bodyOf(function(){
		define('foo/bar', ['A', "f"], function(A, f){
			foo;
			var foo = 1;
			bar = 2;

			require: 'a', "b", 'c'

			labeled: function bah(){
				var x,z;
				y = 10;
			}

			require:
				"c"
				"d";
			"e"

			bah = require('c');

			require: exports: var efoo, ebar;

			var someVariable = {
				obj: initializer,
				obj2: function(a,b){
					return a / require('A') / b;
				}
			}, someOtherVariable

			foo();

			exports: function foobar(){
				exports: function shouldNotFindThis(){}
			}

		});

		define(function(require, exports){
			exports.x = require('D');
		});

		define({});
	});

	it('should identify the module id', function(){
		var module = parse(sample);
		expect(module.id).toEqual('foo/bar');
	});

	it('should find all dependencies', function(){
		var module = parse(sample);
		expect(module.requires.length).toEqual(4);
	});

	it('should find no imported dependencies', function(){
		var module = parse(sample);
		expect(module.imports.length).toEqual(0);
	});

	var sample2 = bodyOf(function(){
		define('b', ['sub/c'], function (c) {
		    return {
		        name: 'b',
		        cName: c.name
		    };
		});
	});

	it('should find all dependencies in amd tests', function(){
		var module = parse(sample2);
		expect(module.requires.length).toEqual(1);
	});

});

describe('mode', function(){
	var sampleLexicalScope = bodyOf(function(){
		var x = 1;
		function bah(){
			"use strict";
			var x,z;
			y = 10;
		}
	});

	var sampleEval = bodyOf(function(){
		var x = 1;
		eval('x');
	});

	var sampleWith = bodyOf(function(){
		function bah(){
			var x,z;
			with (something)
				x = 1;
		}
	});

	var sampleStrictEval = bodyOf(function(){
		"use strict";
		var x = 1;
		eval('x');
	});

	var shadowedEval = bodyOf(function(){
		var x = 1;
		var eval = function(){};
		eval('x');
	});

	it('should find identify the right lexical scope for with and eval', function(){
		expect(parse(sampleLexicalScope).lexicalScope).toBeTruthy();
		expect(parse(sampleEval).lexicalScope).toBeFalsy();
		expect(parse(sampleWith).lexicalScope).toBeFalsy();
		expect(parse(sampleStrictEval).lexicalScope).toBeFalsy();
		expect(parse(shadowedEval).lexicalScope).toBeTruthy();
	});

	it('should flag strict mode for program but not nested strict modes', function(){
		expect(parse(sampleLexicalScope).strict).toBeFalsy();
		expect(parse(sampleEval).strict).toBeFalsy();
		expect(parse(sampleWith).strict).toBeFalsy();
		expect(parse(sampleStrictEval).strict).toBeTruthy();
	});
});

});
