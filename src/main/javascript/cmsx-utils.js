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

module.exports = utils;