var utils = {};

utils.bindAll = function(obj) {
	var k, entry;

	for (k in obj) {
		entry = obj[k];
		if (typeof entry === 'function') {
			obj[k] = obj[k].bind(obj);
		}
	}
};

utils.extend = function(dest, srcObjects) {
	var src, i, k;

	for (i = 1; i < arguments.length; i++) {
		src = arguments[i];
		for (k in src) {
			if (src.hasOwnProperty(k)) {
				dest[k] = src[k];
			}
		}
	}
	return dest;
};

/*var decorate = function(decoratorFn, superFn) {
	return function() {
		decoratorFn.apply(this, [superFn].concat(Array.prototype.slice.call(arguments)));
	};
};

utils.decorate = function(obj, decorators) {
	var i, k, decorator;
	obj = obj || {};

	for (i = 1; i < arguments.length; i++) {
		decorator = arguments[i];

		for (k in decorator) {
			if (decorator.hasOwnProperty(k)) {
				if (typeof obj[k] === 'function') {
					if (typeof obj[k] === 'function') {
						// Decorate existing function
						obj[k] = decorate(decorator[k], obj[k]);
					} else if (obj[k] === undefined) {
						// Assign new plain function from decorator
						obj[k] = decorator[k];
					} else {
						throw 'Value on property ' + k + ' cannot be decorated';
					}
				} else { // Set value (should be primitive value only since else it is shared in all instances)
					obj[k] = decorator[k];
				}
			}
		}
	}
	return obj;
};*/

module.exports = utils;