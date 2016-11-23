var debug = !!window.location.href.match(/(\?|&)debug=1(&|#|$)/);

// TODO: choose debug impl only if flag set
Function.prototype.bind = function(thisObj) {
	var boundArgs = Array.prototype.slice.call(arguments, 1),
		fn = this;
	return function() {
		var args = boundArgs.concat(Array.prototype.slice.call(arguments));
		try {
			return fn.apply(thisObj, args);
		} catch(err) {
			if (!err._cmsxReported) {
				err._cmsxReported = true;
				var stack = err.stack ? '\n' + err.stack : '';

				if (console && console.log) {
					console.log('ERROR: ' + err + stack);
				}
			}
			throw err;
		}
	};
};


if (!Array.prototype.map) {
	Array.prototype.map = function(callback, thisArg) {
		var i, result = [];
		for (i = 0; i < this.length; i++) {
			result.push(callback.call(thisArg, this[i], i, this));
		}
		return result;
	};
}

if (!Array.prototype.reduce) {
	Array.prototype.reduce = function(callback, initialValue) {
		for (var i = 0; i < this.length; i++) {
			initialValue = callback(initialValue, this[i], i, this);
		}
		return initialValue;
	};
}

//if (!Array.prototype.filter) {
	Array.prototype.filter = function(callback, thisArg) {
		var i, item, filtered = [];
		for (i = 0; i < this.length; i++) {
			item = this[i];
			if (callback.call(thisArg, item, i, this)) {
				filtered.push(item);
			}
		}
		return filtered;
	};
//}

//if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(callback, thisArg) {
		for (var i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this);
		}
	};
//}