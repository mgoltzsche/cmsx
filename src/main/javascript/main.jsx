/**
 * Browser limitations:
 *   contenteditable:  not in Opera Mini, IE>=8,  FF49, Safari/iOS Safari 10
 *   classList:        not in Opera Mini, IE>=11, FF49, Safari/iOS Safari 10
 *     (IE11: doesn't support multiple args on toggle(), add(), remove(); doesn't work with svg)
 *   addEventListener: IE>=11, FF49, Safari/iOS Safari 10
 *   input event:      not in Opera Mini, IE>=11, FF49, Safari/iOS Safari 10
 */

var $ = require('jquery');
var MediumEditor = require('medium-editor');
var saveExt = require('./cmsx-editor-save-extension.js');
//var SimpleEdit = require('./cmsx-simple-edit.js');
var CmsxService = require('./cmsx-service.js');
var toolbar = require('./cmsx-toolbar.js');
var WebDavClient = require('./webdav-client.js');
var WebDavBrowser = require('./cmsx-webdav-browser.jsx');
var PageBrowser = require('./cmsx-page-browser.jsx');
var React = require('react');
var ReactDOM = require('react-dom');

var webDavClient = new WebDavClient('admin', 'admin');
var cmsx = new CmsxService('');

function createPageTitleEditor() {
	var ctx = {pageTitle: ''};
	var editor = new MediumEditor('.cmsx-page-title', {
		keyboardCommands : false,
		anchorPreview : false,
		disableReturn : true,
		disableDoubleReturn : true,
		disableExtraSpaces : true,
		spellcheck : false,
		placeholder : {
			text : 'Page title',
			hideOnClick : true
		},
		toolbar: {
			static: true,
			sticky: false,
			updateOnEmptySelection: true,
			buttons: ['save', 'cancel']
		},
		extensions: {
			'save': new saveExt.MediumSaveButton(function(value) {
				console.log('update title: ' + value);
				//cmsx.updateDocument(doc, xpath, xml, 'application/xml; charset=utf-8');
			}),
			'cancel': new saveExt.MediumCancelButton()
		}
	});
/*	editor.subscribe('editableKeyup', function(evt) {
		evt = evt || window.event;
		var newTitle = (evt.target || evt.srcElement).textContent;

		if (ctx.pageTitle != newTitle && newTitle !== "") {
			ctx.pageTitle = newTitle;
			cmsx.setPageProperty('title', newTitle);
		}
	});*/
}

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

/*
 * function edited(doc, path, evt, editable) { evt = evt || window.event;
 * console.log((evt.target || evt.srcElement).innerHTML); };
 */
$(document).ready(function() {
	var content1 = document.createElement('div');
	var pageBrowserButton = new toolbar.CmsxToolbarContent('pages', content1, function(content) {
		if (this.childNodes.length == 0) {
			ReactDOM.render(<PageBrowser />, this);
		}
	}.bind(content1));

	var content2 = document.createElement('div');
	var resourceBrowserButton = new toolbar.CmsxToolbarContent('resources', content2, function(content) {
		if (this.childNodes.length == 0) {
			var webDavBrowser = ReactDOM.render(<WebDavBrowser rootURL="/webdav"
				client={webDavClient} />, this);
			webDavBrowser.show('');
		}
	}.bind(content2));
	new toolbar.CmsxToolbar([pageBrowserButton, resourceBrowserButton]);
	//createPageTitleEditor();

	/*
	 * $('.cmsx-richedit').forEach(function() { var doc =
	 * this.data('cmsx-document'), path = this.data('cmsx-path'); });
	 */

	/*new SimpleEdit('.cmsx-edit', function(evt, editable) {
		var doc = editable.getAttribute('data-cmsx-doc'),
			xpath = editable.getAttribute('data-cmsx-xpath'),
			content = editable.textContent;
		console.log('edited: ' + doc + '/' + xpath + ' ' + content);
		//cmsx.updateDocument(doc, xpath, content, 'text/plain; charset=utf-8');
	});*/

	var syncManager = new ContentSyncManager(function(changes) {
		for (var i = 0; i < changes.length; i++) {
			var c = changes[i];
			cmsx.updateDocument(c.doc, c.xpath, c.content, c.contentType + '; charset=utf-8');
		}
	});

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
				syncManager.sync(change);
			})
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
				syncManager.sync(change);
			})
		}
	});
});