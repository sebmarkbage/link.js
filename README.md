What is this?
-------------

Link.js is a module loader and conversion tool. It supports Labeled Modules, CommonJS and Asynchronous Module Definitions (AMD).

Link.js is the first loader to support the Labeled Modules format. It emulates the import and export statements in ECMAScript.next. In Labeled Modules, the labels **require:** and **exports:** can be used to import or export top level variables in a module.

```javascript
require: "Math"

function length(a, b){
	return abs(a - b);
}

exports: function area(x1, y1, x2, y2){
  return length(x1, x2) * length(y1, y2);
}
```

These files are compatible with plain old script tag loading - without bloated boilerplate.

[Read more about this on the Labeled Modules Specification.](http://github.com/labeledmodules/labeled-modules-spec/wiki)


How Do I Run This in the Browser?
---------------------------------

```html
<script src="Source/Web/link.js" data-main="YourMainModule"></script>
```

The first attribute is the path to link.js and the second is the path to your main module.


How Do I Run This in Node.js?
-----------------------------

As a global runtime:

```
npm install -g link
```

```
linkjs YourMainModule
```

OR

As a local dependency:

```
npm install link
```

```javascript
require('link'); // This will allow future modules to use Link.js
require('YourMainModule');
```

By using Link.js as a local dependency you can use it as a loader even if your (or your users') environments don't have Link.js installed globally.


How Do I Convert My Source Files to CommonJS or AMD?
----------------------------------------------------

```
npm install -g link
```

```
linkjs --cjs YourModule > YourModuleForCommonJS.js

linkjs --amd YourModule > YourModuleForAMD.js

linkjs -c -a YourModule > YourModuleForCommonJSandAMD.js
```

Library/Link.js
---------------

This is a library designed to be embedded by other script loaders or as part of
a plugin to other script loaders. It's purpose is to parse a JavaScript file and
statically determine any dependencies.

Beyond recognizing Labeled Modules it also recognizes CommonJS modules and
Asynchronous Module Definitions (AMD).

It can also convert these JavaScript files into a format compatible with CommonJS,
Asynchronous Module Definitions and/or exports to the global object

```javascript
var commonJSsource = require('link').parse(source).convert(options);
```

In static mode, the imported modules are resolved and global variables are replaced with explicit module properties. I.e:

```javascript
require: "Math";
exports: var x = abs(5);
```

is resolved to:

```javascript
var Math = require('Math');
exports.x = Math.abs(5);
```

Static mode is recommended to generate production ready files. In dynamic mode, the imported variables are determined at runtime using a with statement. Your source code is untouched. This is recommended during development.

See the source file for additional options.


Node/Link.js
------------

This is a runtime loader and script conversion tool for Node.js. It can be ran stand-alone but it's recommended that you install it using NPM.

```
npm install -g link
```

You can use this tool to convert your modules into other module formats or universal module formats. You can target multiple formats in a single file.

```
Usage:
linkjs --output [filename] [--global] [--cjs] [--amd] [--strict] modulename
linkjs modulename [argv...]

Options:
--output [filename]        Convert the input file to one or more of the formats below.
                           If no filename is provided, the result is written to stdout.
[--global] [--cjs] [--amd] Select a target format: the global object, CommonJS or AMD.
[--strict]                 Enforce dynamic strict mode. Requires ECMAScript 5.

-[o|g|c|a|s]               Single character shortcuts for the above options.

modulename [argv...]       Run a module in Node.js, with optional arguments.
```

You can alternatively use Link.js as a plugin to Node's existing module loader. First, install it as a local dependency.

```
npm install link
```

Then require it at the first line of your application or module.

```javascript
require('link');
```

Any subsequent calls to require can now use Labeled Modules or AMD syntax. However, the first loaded module can't because the plugin has not been loaded yet. Your entry module should use CommonJS while sub-modules can use Labeled Modules or AMD.


Web/Link.js
-----------

This is a script loader for use in the browser environment. It uses Link.js to load, parse and execute scripts in isolated scopes so that there are no conflicts between the files. It supports at least Chrome, Safari, Firefox, Opera and IE6+.

To load a module using Link.js simply add a script tag to your HTML where the **src** attribute points to link.js and the **data-main** attribute specifies your main module to load.

```html
<script src="link.js" data-main="ApplicationRootModule.js"></script>
```

Link.js doesn't normally expose an API to the global object. It can be **required** from within your module though. The exported API is the same as the Module Loader API proposed for [ECMAScript.next](http://wiki.ecmascript.org/doku.php?id=harmony:module_loaders).


Debugging
---------

Web/Link.js uses XHR to load and parse your code, then it executes it using **eval**.

Some browser tools won't allow debugging of eval:ed code by default. However, Link.js
uses the `//@ sourceURL=...` convention to enable proper debugging in compatible browsers.

In Safari 5.1, this feature is broken for JIT:ed code. It's fixed in the nightly builds.

IE and Opera does support debugging of eval:ed code but doesn't give them a proper name in the
UI. This means breakpoints are not persistent between page reloads. Please bug them until they
fix this.

A future enhancement of Web/Link.js could load some files that do not conflict in plain
script tags.


Hosting Cross-Domain
--------------------

If you're hosting your development source code, you should enable
[Cross-Origin Resource Sharing](http://www.w3.org/TR/cors/) on your server. This will enable
full Link.js support in browsers that support CORS.

If you're unable to use CORS, you could still load cross-domain modules in legacy mode,
if they don't share export names. You simply load the modules and any indirect dependencies
in the right order.

If you're able to host a HTML file, you could also use an porthole compatible loader, such as
[Inject](https://github.com/linkedin/inject), that enable cross-domain loading through an
iframe proxy.

If you're loading from the file:// protocol and XHR is not supported (Chrome), or you wish
to host your files cross-domain in production, you can use Link.js to convert your
source files into Asynchronous Module Definitions (AMD).


Known Issues
------------

There are a few very subtle cases where the semantics of Link.js differs from a regular
program. You're very unlikely to hit any of them.

**Deleting a variable** binding is usually a no-op.

```javascript
var x = true;
delete x;
```

After running this code, **x** should still be **true**. However, Link.js may treats global
variables as deletable, so **x** is now **undefined**.

The solution is to avoid using this in your code. If you do have it, it's probably a bug.
ECMAScript 5 strict mode explicitly forbits deleting variable bindings. A future version of
Link.js may ignore such delete statements.

**The function declaration** statement is often missunderstood and can lead to
unexpected behavior.

```javascript
var bar = foo;
function foo(){
	console.log(foo); // "Bar"
}
foo = "Bar";
bar();
```

This should output "Bar" as you might expect. However, Link.js treats exported function
declarations more like this:

```javascript
var foo = function foo(){
	console.log(foo); // function
};
var bar = foo;
foo = "Bar";
bar();
```

This subtle difference means that `console.log(foo);` no longer refers to the global variable
binding `foo` but directly to the function itself. You're very unlikely to hit this issue.

Additionally, V8 (incorrectly) won't allow labels on function declarations in strict mode.

To avoid confusion in edge cases, you can use anonymous function expressions syntax for
exported functions:

```javascript
exports: var foo = function(){ ... };
```

Thanks
------

A special thanks to [@dherman](https://github.com/dherman) for coming up with ECMAScript.next modules and with the name Link.js for this library.