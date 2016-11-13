var $ = require('jquery');
var utils = require('../cmsx-utils.js');

function CmsxService(rootURI) {
	if (rootURI === undefined || rootURI === null) {throw 'Undefined CmsxService rootURI';}
	this._rootURI = rootURI;
	utils.bindAll(this);
}

var service = CmsxService.prototype;

service.loadPage = function(pageID, callback) {
	$.get({
		url: this._rootURI + '/service/page/' + pageID,
		dataType: 'json',
		success: function(page) {
			callback(page);
		}
	});
};

service.updatePage = function(page, callback) {
	$.post({
		url: this._rootURI + '/service/page/' + page.id,
		contentType: 'application/json',
		data: JSON.stringify(page),
		dataType: 'text',
		success: function() {
			console.log('page saved');
			callback(page);
		}
	});
};

service.setPageProperty = function(name, value, pageUrl) {
	var url = pageUrl || window.location.href;
	var data = 'prop=' + encodeURIComponent(name) + '&val=' + encodeURIComponent(value);

	// TODO: error handling
	$.post(url, data, function(xhr) {
		console.log('Property set');
	});
};

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