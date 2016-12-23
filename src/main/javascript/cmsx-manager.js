var utils = require('./cmsx-utils.js');
var MediumEditor = require('medium-editor');
var saveExt = require('./cmsx-editor-save-extension.js');
var CmsxService = require('./services/cmsx-service.js');
var CmsxPageService = require('./services/cmsx-page-service.js');
var WebDavClient = require('./services/webdav-client.js');
var toolbar = require('./ui/cmsx-site-toolbar.js');
var ContextMenu = require('./ui/cmsx-context-menu.js');
var TreeView = require('./ui/cmsx-tree-view.js');
var CmsxPageList = require('./ui/cmsx-page-list.js');
var CmsxResourceList = require('./ui/cmsx-resource-list.js');

function ContentSyncManager(onChanged) {
	this._handler = onChanged;
	this._changes = {};
	this._pristine = true;
	this._delayedChangeHandler = this.flushIfUserInactive.bind(this);
}

var sm = ContentSyncManager.prototype;
sm.delay = 1500;

sm.flushIfUserInactive = function() {
	if (new Date().getTime() - this._lastChangeTime > this.delay) {
		this.flush();
	} else {
		setTimeout(this._delayedChangeHandler, this.delay);
	}
};

sm.flush = function() {
	if (!this._pristine) {
		var changes = [];

		for (var k in this._changes) {
			if (this._changes.hasOwnProperty(k)) {
				changes.push(this._changes[k]);
			}
		}

		this._handler(changes);
		this._changes = {};
		this._pristine = true;
	}
};

sm.sync = function(change) {
	this._changes[change.doc + ':' + change.xpath] = change;
	this._lastChangeTime = new Date().getTime();

	if (this._pristine) {
		setTimeout(this._delayedChangeHandler, this.delay);
		this._pristine = false;
	}
};

function CmsxManager() {
	utils.bindAll(this);

	var rootURL = '',
		pageService = new CmsxPageService(rootURL),
		contentService = new CmsxService(rootURL),
		webdav = new WebDavClient('/webdav', 'admin', 'admin');
	this.resourceList = new CmsxResourceList(webdav); // TODO: init lazy
	this.pageList = new CmsxPageList(pageService, this.pickResource);
	this.syncService = new ContentSyncManager(function(contentService, changes) {
		for (var i = 0; i < changes.length; i++) {
			var c = changes[i];
			contentService.updateDocument(c.doc, c.xpath, c.content, c.contentType + '; charset=utf-8');
		}
	}.bind(this, contentService));

	// Setup content editors
	new MediumEditor('.cmsx-edit', {
		disableReturn : true,
		disableDoubleReturn : true,
		keyboardCommands: false,
		toolbar: false,
		anchorPreview : false,
		spellcheck : false,
		placeholder : {
			text : 'Content',
			hideOnClick : true
		},
		extensions: {
			'save': new saveExt.MediumChangeListener(function(change) {
				change.content = change.editable.textContent;
				change.contentType = 'text/plain';
				delete change.editable;
				this.syncService.sync(change);
			}.bind(this))
		}
	});
	new MediumEditor('.cmsx-richedit', {
		anchorPreview : true,
		spellcheck : false,
		placeholder : {
			text : 'Content',
			hideOnClick : true
		},
		toolbar: {
			static: false,
			updateOnEmptySelection: true,
			buttons: ['save', 'cancel', 'bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote', 'removeFormat']
		},
		extensions: {
			'save': new saveExt.MediumChangeListener(function(change) {
				var brFixPattern = /<br\s*>/g;
				var content = change.editable.innerHTML;
				content = content.replace(brFixPattern, '<br/>');
				change.content = '<article xmlns="http://www.w3.org/1999/xhtml">' + content + '</article>';
				change.contentType = 'text/html';
				delete change.editable;
				this.syncService.sync(change);
			}.bind(this))
		}
	});


	// Setup toolbar
	var content1 = document.createElement('div');
	var content2 = document.createElement('div');
	var pageBrowserButton = new toolbar.CmsxToolbarContent('pages', content1, function(element) {
		if (element.childNodes.length === 0) {
			// TODO: refactor so that components can be passed to site-toolbar
			this.pageList.load();
			element.appendChild(this.pageList.element());
		}
	}.bind(this, content1));
	var resourceBrowserButton = new toolbar.CmsxToolbarContent('resources', content2, function(element) {
		if (element.childNodes.length === 0) {
			this.resourceList.load();
			element.appendChild(this.resourceList.element());
		}
	}.bind(this, content2));
	new toolbar.CmsxToolbar([pageBrowserButton, resourceBrowserButton]);
}

var manager = CmsxManager.prototype;

manager.pickResource = function(evt, currentValue, callback) {
	this.resourceList.pickResource(evt, currentValue, callback);
};

manager.destroy = function() {
	this.pageList.destroy();
	this.resourceList.destroy();
	delete this.pageList;
	delete this.resourceList;
	ContextMenu.destroy();
	ConfirmDialog.destroy();
};

module.exports = CmsxManager;