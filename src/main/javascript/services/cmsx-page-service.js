var $ = require('jquery');
var utils = require('../cmsx-utils.js');

function CmsxPageService(rootURI) {
	if (rootURI === undefined || rootURI === null) {throw 'Undefined CmsxPageService rootURI';}
	this._rootURI = rootURI;
	utils.bindAll(this);
}

var service = CmsxPageService.prototype;

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

module.exports = CmsxPageService;