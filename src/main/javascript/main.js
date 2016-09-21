var $ = require('jquery');
var MediumEditor = require('medium-editor');
var saveExt = require('./cmsx-editor-save-extension.js');
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

var brFixPattern = /<br\s*>/g;

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
	var editor = new MediumEditor('.cmsx-edit, .cmsx-richedit', {
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
			static: true,
			sticky: true,
			updateOnEmptySelection: true,
			buttons: ['save', 'cancel', 'bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote', 'removeFormat']
		},
		extensions: {
			'save': new saveExt.MediumSaveButton(function(contents) {
				for (var i = 0; i < contents.length; i++) {
					var c = contents[i];
					var content = c.editable.innerHTML;
					var contentType;

					if (c.editable.classList.contains('cmsx-richedit')) {
						// richedit - send XML
						contentType = 'application/xml';
						content = '<article xmlns="http://www.w3.org/1999/xhtml">' + content.replace(brFixPattern, '<br/>') + '</article>';
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