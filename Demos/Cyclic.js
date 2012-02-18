"use strict";
require: "./Even", "./Log"
var odd = !even(1); // The global conflict with Odd.js is resolved by Link.js
log('1 is ' + (odd ? 'odd' : 'even'));
odd = !even(2);
log('2 is ' + (odd ? 'odd' : 'even'));