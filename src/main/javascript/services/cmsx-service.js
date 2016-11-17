var $ = require('jquery');
var utils = require('../cmsx-utils.js');

function CmsxService(rootURI) {
	if (rootURI === undefined || rootURI === null) {throw 'Undefined CmsxService rootURI';}
	this._rootURI = rootURI;
	utils.bindAll(this);
}

var service = CmsxService.prototype;

service.updateDocument = function(doc, xpath, value, contentType) {
	var url = this._rootURI + '/doc/' + doc + '?xpath=' + encodeURIComponent(xpath || '*');

	// TODO: error handling
	$.post({
		url: url,
		data: value,
		contentType: contentType,
		dataType: 'text',
		success: function(xhr) {
			console.log("doc " + doc + ",  xpath: " + xpath + " saved");
		},
	});
};

module.exports = CmsxService;