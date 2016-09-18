var $ = require('jquery');
var CmsxService = require('./cmsx-service.js');
var MediumEditor = require('medium-editor');

var cmsx = new CmsxService('');

function createPageTitleEditor() {
	var ctx = {pageTitle: ''};
	var editor = new MediumEditor('#cmsx-page-title', {
		toolbar : false,
		keyboardCommands : false,
		anchorPreview : false,
		disableReturn : true,
		disableDoubleReturn : true,
		disableExtraSpaces : true,
		spellcheck : false,
		placeholder : {
			text : 'Page title',
			hideOnClick : true
		}
	});
	editor.subscribe('editableKeyup', function(evt) {
		evt = evt || window.event;
		var newTitle = (evt.target || evt.srcElement).textContent;

		if (ctx.pageTitle != newTitle && newTitle !== "") {
			ctx.pageTitle = newTitle;
			cmsx.setPageProperty('title', newTitle);
		}
	});
}

function serializeXML(xmlNode) {
   try {
      // Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
      return (new XMLSerializer()).serializeToString(xmlNode);
  }
  catch (e) {
     try {
        // Internet Explorer.
        return xmlNode.xml;
     }
     catch (e) {
        // Other browsers without XML Serializer
        alert('XMLSerializer not supported. Please use a different browser');
     }
   }
   return false;
}

function obj(o, d) {
	var str = '';
	if (typeof o === 'object') {
	var ind = "";
	for (var i = 0; i < d; i++) {
		int += "  ";
	}
	for (var k in o) {
		str += "\n" + ind + k + ': ' + obj(o[k], d + 1);
	}
	} else {
		str = "" + o;
	}
	return str;
}

/*
 * function edited(doc, path, evt, editable) { evt = evt || window.event;
 * console.log((evt.target || evt.srcElement).innerHTML); };
 */
$(document).ready(function() {
	createPageTitleEditor();

	var brFixPattern = /<br\s*>/g;
	/*
	 * $('.cmsx-richedit').forEach(function() { var doc =
	 * this.data('cmsx-document'), path = this.data('cmsx-path'); });
	 */
	var editor = new MediumEditor('.cmsx-richedit', {
		anchorPreview : true,
		disableReturn : false,
		disableDoubleReturn : false,
		disableExtraSpaces : true, /* Creates html entities and is bad style */
		spellcheck : false,
		toolbar: {
			static: true,
			sticky: true,
			updateOnEmptySelection: true
		},
		placeholder : {
			text : 'Content',
			hideOnClick : true
		}
	});
	editor.subscribe('editableInput', function(evt, editable) {
		evt = evt || window.event;
		var el = evt.target || evt.srcElement;
		var doc = el.getAttribute('data-cmsx-doc');
		var xpath = el.getAttribute('data-cmsx-xpath');
		//console.log(doc + ' ' + xpath + ' ' + serializeXML(el));
		cmsx.updateValue(doc, xpath, '<article xmlns="http://www.w3.org/1999/xhtml">' + el.innerHTML.replace(brFixPattern, '<br/>') + '</article>', 'application/xml; charset=utf-8');
	});
});