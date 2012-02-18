exports: log;
var log = (typeof document !== 'undefined') ? (function(){
	document.body.appendChild(document.createElement('br'));
	document.body.appendChild(document.createTextNode(Array.prototype.join.call(arguments, ' ')));
}) : (function(){
	console.log.apply(console, arguments);
});

(function(){
	// Export to global
	if (!this.console) this.console = { log: log, warn: log };
}());