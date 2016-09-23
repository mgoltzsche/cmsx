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
var SimpleEdit = require('./cmsx-simple-edit.js');
var CmsxService = require('./cmsx-service.js');

var cmsx = new CmsxService('');

function createPageTitleEditor() {
	var ctx = {pageTitle: ''};
	/*var editor = new MediumEditor('.cmsx-page-title', {
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
	});*/
/*	editor.subscribe('editableKeyup', function(evt) {
		evt = evt || window.event;
		var newTitle = (evt.target || evt.srcElement).textContent;

		if (ctx.pageTitle != newTitle && newTitle !== "") {
			ctx.pageTitle = newTitle;
			cmsx.setPageProperty('title', newTitle);
		}
	});*/
}

/*
 * function edited(doc, path, evt, editable) { evt = evt || window.event;
 * console.log((evt.target || evt.srcElement).innerHTML); };
 */
$(document).ready(function() {
	createPageTitleEditor();

	/*
	 * $('.cmsx-richedit').forEach(function() { var doc =
	 * this.data('cmsx-document'), path = this.data('cmsx-path'); });
	 */
	new SimpleEdit('.cmsx-edit', function(evt, editable) {
		var doc = editable.getAttribute('data-cmsx-doc'),
			xpath = editable.getAttribute('data-cmsx-xpath'),
			content = editable.textContent;
		console.log('edited: ' + doc + '/' + xpath + ' ' + content);
		//cmsx.updateDocument(doc, xpath, content, 'text/plain; charset=utf-8');
	});
	new MediumEditor('.cmsx-richedit', {
		anchorPreview : true,
		disableReturn : false,
		disableDoubleReturn : false,
		disableExtraSpaces : false, // Creates html entities and is bad style
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
			'save': new saveExt.MediumSaveButton(function(contents) {
				var brFixPattern = /<br\s*>/g;

				for (var i = 0; i < contents.length; i++) {
					var c = contents[i];
					var content = c.editable.innerHTML;
					var contentType;

					if (c.editable.classList.contains('cmsx-richedit')) {
						// richedit - send XML
						contentType = 'text/html';
						content = content.replace(brFixPattern, '<br/>');
						content = '<article xmlns="http://www.w3.org/1999/xhtml">' + content + '</article>';
					} else {
						// simple edit - send text
						contentType = 'text/plain';
					}

					cmsx.updateDocument(c.doc, c.xpath, content, contentType + '; charset=utf-8');
				}
			}),
			'cancel': new saveExt.MediumCancelButton()
		}
	});
});