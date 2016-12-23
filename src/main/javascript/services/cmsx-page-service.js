var $ = require('jquery');
var utils = require('../cmsx-utils.js');

function CmsxPageService(rootURI) {
	if (rootURI === undefined || rootURI === null) {throw 'Undefined CmsxPageService rootURI';}
	this._rootURI = rootURI;
	utils.bindAll(this);
}

var service = CmsxPageService.prototype;

service.loadPage = function(pageID, callback) {
	$.ajax({
		method: 'GET',
		url: this._rootURI + '/service/page/' + pageID,
		dataType: 'json',
		success: callback
	});
};

service.createPage = function(page, parentPageID, callback) {
	$.ajax({
		method: 'PUT',
		url: this._rootURI + '/service/page' + (parentPageID ? '/' + parentPageID : '') + '/' + page.id,
		contentType: 'application/json',
		data: JSON.stringify(page),
		dataType: 'text',
		success: function() {
			callback(page);
		}
	});
};

service.updatePage = function(page, callback) {
	$.ajax({
		method: 'POST',
		url: this._rootURI + '/service/page/' + page.id,
		contentType: 'application/json',
		data: JSON.stringify(page),
		dataType: 'text',
		success: function() {
			callback(page);
		}
	});
};

service.deletePage = function(pageID, callback) {
	$.ajax({
		method: 'DELETE',
		url: this._rootURI + '/service/page/' + pageID,
		success: function() {
			callback(pageID);
		}
	});
};

service.movePageAsLast = function(pageID, parentPageID, callback) {
	this.movePage(pageID, parentPageID, 'append', callback);
};

service.movePageBefore = function(pageID, beforePageID, callback) {
	this.movePage(pageID, beforePageID, 'before', callback);
};

service.movePage = function(pageID, destContextPageID, mode, callback) {
	$.ajax({
		method: 'MOVE',
		url: this._rootURI + '/service/page/' + pageID,
		headers: {
			'Move-Context': destContextPageID,
			'Move-Mode': mode
		},
		success: function() {
			callback(pageID, destContextPageID, mode);
		}
	});
};

module.exports = CmsxPageService;