var MediumEditor = require('medium-editor');
var saveExt = require('./cmsx-editor-save-extension.js');
var CmsxService = require('./cmsx-service.js');
var toolbar = require('./cmsx-toolbar.js');
var WebDavClient = require('./webdav-client.js');
var ContextMenu = require('./cmsx-context-menu.js');
var createDialog = require('./cmsx-dialog.js');
var form = require('./cmsx-form.js');
var React = require('react');
var ReactDOM = require('react-dom');
var PageBrowser = React.createFactory(require('./cmsx-page-browser.js'));
var utils = require('./cmsx-utils.js');

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

	this.service = new CmsxService('');
	this.syncManager = new ContentSyncManager(function(changes) {
		for (var i = 0; i < changes.length; i++) {
			var c = changes[i];
			this.service.updateDocument(c.doc, c.xpath, c.content, c.contentType + '; charset=utf-8');
		}
	}.bind(this));

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
				this.syncManager.sync(change);
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
				this.syncManager.sync(change);
			}.bind(this))
		}
	});


	// Setup toolbar
	var content1 = document.createElement('div');
	var pageBrowserButton = new toolbar.CmsxToolbarContent('pages', content1, function(element) {
		if (element.childNodes.length === 0) {
			var pageID = this.currentPageID();
			console.log('Page ID: ' + pageID);
			ReactDOM.render(PageBrowser({
				pageID: pageID,
				loader: this.service.loadPage,
				onPageOptions: this.showPageContextMenu
			}), element);
		}
	}.bind(this, content1));

	var content2 = document.createElement('div');
	var resourceBrowserButton = new toolbar.CmsxToolbarContent('resources', content2, function(element) {
		if (element.childNodes.length === 0) {
			var WebDavBrowser = React.createFactory(require('./cmsx-webdav-browser.jsx'));
			ReactDOM.render(WebDavBrowser({
				rootURL: "/webdav",
				client: new WebDavClient('admin', 'admin')
			}), element);
		}
	}.bind(undefined, content2));
	new toolbar.CmsxToolbar([pageBrowserButton, resourceBrowserButton]);
}

var manager = CmsxManager.prototype;

manager.currentPageID = function() {
	var id = window.location.href.match(/([^\/]+)\/index.html(\?|#|$)/)[1];
	return id === 'p' ? '' : id;
};

manager.showPageContextMenu = function(page, evt) {
	if (!this._pageContextMenu) {
		this._pageContextMenu = new ContextMenu([
     		{
    			label: 'edit',
    			callback: this.showPageEditDialog
    		},
    		{
    			label: 'delete',
    			callback: this.deletePage
    		},
    		{
    			label: 'add',
    			callback: this.showPageCreateDialog
    		},
    		{
    			label: 'pick',
    			callback: this.pickPage
    		}
    	]);
	}

	this._pageContextMenu.show(evt, page);
};

manager.showPageEditDialog = function(page) {
	if (!this._pagePreferencesForm) {
		this._pagePreferencesForm = new form.CmsxForm()
			.addInput('id', 'ID')
			.addInput('title', 'Title')
			.addInput('renderer', 'Renderer')
			.addPickableInput('src', 'Content', 'text', this.pickResource)
			.addInput('stylesheet', 'XSLT stylesheet')
			.addButton('save', this.savePage);
		this._pagePreferencesDialog = createDialog();
		this._pagePreferencesForm.mountAt(this._pagePreferencesDialog.getElements().content);
	}

	this._pagePreferencesForm.set(page);
	this._pagePreferencesDialog.show();
};

manager.savePage = function(page) {
	console.log(page);
	//this.service.savePage(page);
};

manager.showPageCreateDialog = function(parentPage) {
	this.showPageEditDialog({parent: parentPage.id}); // TODO: handle parent
};

manager.deletePage = function(page) {
	console.log('TODO: delete page');
	//this.service.deletePage(page.id);
};

manager.pickPage = function(setter) {
	if (!this._pagePicker) {
		this._pagePickerDialog = createDialog({preferredWidth: 500, preferredHeight: 300});
		this._pagePicker = ReactDOM.render(PageBrowser({
			loader: this.service.loadPage,
			onPageOptions: this.showPageContextMenu
		}), this._pagePickerDialog.getElements().content);
	}

	this._pagePicker.show(this.currentPageID());
	this._pagePickerDialog.show();
};

manager.pickResource = function(setter) {
	console.log('TODO: resource picker');
};

module.exports = CmsxManager;