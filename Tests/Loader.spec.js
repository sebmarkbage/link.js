with(require('../Source/Node/link'))

describe('Loader', function(){
	var specRoot = typeof location !== 'undefined' ?
		location.pathname.substr(0, location.pathname.lastIndexOf('/')) :
		__dirname;

	beforeEach(function() {
		// Clear loaded
		for (var key in loaded)
			delete loaded[key];

		this.addMatchers({
			toSatisfy: function(message) {
				this.message = function(){
					return message;
				};
				return this.actual;
			}
		});
	});

	function itShouldPass(root, testname){
		it(testname, function(done){
			base(root);
			alias('test', specRoot + '/node_modules/test.js');

			load('program', function(module){
				base(specRoot);
				done(testname === 'missingImport' ? new Error('Should fail') : null); // missingImport should fail
			}, function(error){
				base(specRoot);
				done(testname === 'missingImport' ? null : error); // missingImport should fail
			});
		});
	}

	describe('Labeled Modules', function(){
		var tests = [
			'absolute',
			'cyclic',
			'determinism',
			'exactExports',
			'hasOwnProperty',
			'method',
			'missing',
			'missingImport',
			'monkeys',
			'nested',
			'relative',
			'transitive'
		];
		for (var i = 0, l = tests.length; i < l; i++)
			itShouldPass(specRoot + '/labeled-modules/Tests/' + tests[i] + '/', tests[i]);
	});

	describe('CommonJS', function(){
		var tests = [
			'absolute',
			'cyclic',
			'determinism',
			'exactExports',
			'hasOwnProperty',
			'method',
			'missing',
			'monkeys',
			'nested',
			'relative',
			'transitive'
		];
		for (var i = 0, l = tests.length; i < l; i++)
			itShouldPass(specRoot + '/commonjs/tests/modules/1.0/' + tests[i] + '/', tests[i]);
	});

	describe('AMDJS', function(){

		var testRoot = specRoot + '/amdjs/tests/';

		//Define the tests for each level.
		var levels = {
			basic: function () {
				reg('basic/defineAmd');
				reg('basic/simple');
				reg('basic/circular');
			},

			anon: function () {
				reg('anon/simple');
				reg('anon/circular');
				reg('anon/relativeModuleId');
			},

			funcString: function () {
				reg('funcString/funcString');
			},

			namedWrapped: function () {
				reg('namedWrapped/basic');
			},

			require: function () {
				reg('require/basic');
			}

			//plugins: function () {
			//	reg('plugins/double');
			//	reg('plugins/fromText');
			//	reg('plugins/normalize');
			//},

			//pluginDynamic: function () {
			//	reg('plugins/dynamic');
			//	reg('plugins/dynamicToString');
			//}
		};

		function reg(testname){

			it(testname, function(){
				var ran = false;

				doh = {
					register: function(name, functions){
						for (var i = 0, l = functions.length; i < l; i++)
							functions[i]({
								is: function(a,b){
									expect(b).toEqual(a);
								}
							});
					},
					run: function(){ran = true;}
				};

				config = function(config){
					for (var key in config.paths)
						alias(key, config.paths[key]);
				};

				go = eval('var r; define(["require"], function(require){ r = require; }); r;');

				base(testRoot + testname + '-tests.js');
				load(testRoot + testname + '-tests.js', null, function(error){
					expect(false).toSatisfy(String(error));
					ran = true;
				});
				if (!ran) waitsFor(function(){ return ran; });
				runs(function(){
					base(specRoot);
				});
			});

		};

		for (var key in levels)
			describe(key, levels[key]);

	});

	describe('Inject Test Suite minus Cross-Domain', function(){

		var testRoot = specRoot + '/inject/tests/';

		var assertions, isDone;
		function asyncTest(name, expected, factory){
			it(name, function(){
				assertions = 0; isDone = false;
				factory();
				waitsFor(function(){ return isDone; });
				runs(function(){
					expect(assertions).toEqual(expected);
					base(specRoot);
				});
			});
		};

		equal = function(a,b,text){
			assertions++;
			expect(a).toEqual(b);
		};

		ok = function(result, message){
			assertions++;
			if (!result && console.error) console.error('Failed: ', message);
			expect(result).toSatisfy(message);
		};

		start = function(){
			isDone = true;
		};

		describe("CommonJS: Modules 1.0", function(){

			asyncTest("Sample Code", 4, function() {
				base(testRoot + "modules-1.0/includes/spec/");
				load("program");
			});

			asyncTest("Compliance", 8, function() {
				base(testRoot + "modules-1.0/includes/spec/");
				load("compliance");
			});

			asyncTest("#59 require() statements in commented lines should be ignored", 1, function() {
				base(testRoot + "modules-1.0/includes/bugs/");
				load("bug_59");
			});

			asyncTest("#65 circular dependencies should be resolved", 4, function() {
				base(testRoot + "modules-1.0/includes/bugs/");
				load("bug_65");
			});

		});

		describe("CommonJS: Modules 1.1", function(){

			asyncTest("Compliance", 13, function() {
				base(testRoot + "modules-1.1/includes/spec/");
				load("compliance");
			});

			asyncTest("Sample Code", 5, function() {
				base(testRoot + "modules-1.1/includes/spec/");
				load("program");
			});

		});

		describe("CommonJS: Modules 1.1 Extension - Async/A", function(){

			asyncTest("require.ensure", 3, function() {
				base(testRoot + "modules-1.1/includes/spec/");
				var require = eval('require');
				require.ensure(['increment'], function(require) {
				var inc = require('increment').increment;
				var a = 1;
				equal(inc(a), 2, "increment a");
				start();
				});
			});

			asyncTest("#58 require.ensure runtime dependencies only (false)", 1, function() {
				base(testRoot + "modules-1.1/includes/bugs/");
				var require = eval('require');
				require.ensure(["bug_58"], function(require) {
				var runner = require("bug_58");
				runner.runTest(false);
				});
			});

			/*
			Changed from the original test. Should only expect two assertions.
			I believe this spec is incorrect. I believe require.ensure should not execute required
			code until it's loaded with require(...);
			*/
			asyncTest("#58 require.ensure runtime dependencies only (true)", 2, function() {
				base(testRoot + "modules-1.1/includes/bugs/");
				var require = eval('require');
				require.ensure(["bug_58"], function(require) {
				var runner = require("bug_58");
				runner.runTest(true);
				});
			});

		});

		describe("CommonJS: Modules 1.1 Extension - setExports", function(){

			asyncTest("setExports proposal", 2, function() {
				var require = eval('require');
				base(testRoot + "modules-1.1/includes/proposal/");
				require.ensure(["setexports"], function(require) {
				var add = require("setexports");
				equal(add(2), 3, "add function available");
				start();
				});
			});

		});

		describe("CommonJS: Modules 1.1.1", function(){

			asyncTest("Compliance", 13, function() {
				base(testRoot + "modules-1.1.1/includes/spec/");
				load("compliance");
			});

			asyncTest("Compliance - Module Identifiers", 5, function() {
				base(testRoot + "modules-1.1.1/includes/spec/identifiers/");
				load("terms");
			});

			asyncTest("Sample Code", 5, function() {
				base(testRoot + "modules-1.1.1/includes/spec/");
				load("program");
			});

			asyncTest("#56 require.ensure overlapping dependencies", 3, function() {
				var require = eval('require');
				base(testRoot + "modules-1.1.1/includes/bugs/");
				var calls = 2;
				require.ensure(["ensure-overlap/addition", "ensure-overlap/multiply"], function(require) {
				var foo = require("ensure-overlap/addition");
				equal(foo.increment(2), 3, "increments");
				equal(foo.multiply(2), 4, "multiplies");
				if (--calls === 0) { start(); }
				});
				require.ensure(["ensure-overlap/addition"], function(require) {
				var foo = require("ensure-overlap/addition");
				equal(foo.increment(2), 3, "increments");
				if (--calls === 0) { start(); }
				});
			});

		});
	});

	describe("Link.js Test Suite", function(){

		it("should allow dynamic exports by overriding module.exports", function(){
			expect(require('./nodejs/override-exports').foo).toEqual('bar');
		});

		it("should allow a define factory without dependencies", function(){
			expect(require('./nodejs/simple-define').exported).toEqual('object');
		});

		it("should allow a factory without dependencies to assign to this", function(){
			expect(require('./nodejs/define-this').exported).toEqual('object');
		});

	});

});

