function CmsxUtils() {
}

var utils = CmsxUtils.prototype;
var debug = !!window.location.href.match(/(\?|&)debug=1(&|#|$)/);

// TODO: choose debug impl only if flag set
var boundFunction = function(fn, thisObj, boundArgs) {
	return function() {
		var args = boundArgs.concat(Array.prototype.slice.call(arguments));
		try {
			return fn.apply(thisObj, args);
		} catch(err) {
			if (!err._cmsxReported) {
				err._cmsxReported = true;
				var stack = err.stack ? '\n' + err.stack : '';
				console.log('ERROR: ' + err + stack);
			}
			throw err;
		}
	};
};

Function.prototype.bind = function(thisObj) {
	var boundArgs = Array.prototype.slice.call(arguments, 1);
	return boundFunction(this, thisObj, boundArgs);
};

utils.bindAll = function(obj) {
	for (var k in obj) {
		var entry = obj[k];
		if (typeof entry === 'function') {
			obj[k] = obj[k].bind(obj);
		}
	}
};

utils.extend = function(dest, src) {
	for (var k in src) {
		if (src.hasOwnProperty(k)) {
			dest[k] = src[k];
		}
	}
	return dest;
};

module.exports = utils;