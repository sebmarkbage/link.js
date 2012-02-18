require: './Odd'
exports: function even(n){
	return n == 0 || odd(n - 1);
}