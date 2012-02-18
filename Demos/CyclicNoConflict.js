"use strict";
require: "./Even", "./Log"
// Unlike Cyclic.js, this has no conflicts with any of
// it's dependencies. That makes it safe to load through
// simple script tags.
log('1 is ' + (!even(1) ? 'odd' : 'even'));
log('2 is ' + (!even(2) ? 'odd' : 'even'));