require: "../Source/Web/link", "./Log";

var dynamicURL = 'Ev' + 'en';

load(dynamicURL, function(module){
	log('1 is ' + (!module.even(1) ? 'odd' : 'even'));
});

evalAsync("require: 'Odd'; odd(2) ? 'odd' : 'even';", function(answer){
	log('2 is ' + answer)
});