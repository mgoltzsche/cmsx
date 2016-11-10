function CmsxUtils() {
}

var utils = CmsxUtils.prototype;

utils.bindAll = function(obj) {
	for (var k in obj) {
		if (typeof obj[k] === 'function') {
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