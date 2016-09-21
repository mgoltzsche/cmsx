var MediumEditor = require('medium-editor');

var brFixPattern = /<br\s*>/g;

function obj(o, d) {
	var str = '';
	if (typeof o === 'object') {
	var ind = "";
	for (var i = 0; i < d; i++) {
		ind += "  ";
	}
	for (var k in o) {
		str += "\n" + ind + k + ': ' + obj(o[k], d + 1);
	}
	} else {
		str = "" + o;
	}
	return str;
}

function MediumSaveButton(handler) {
	this.name = 'save';
	this.button = this._createButton('save', (function(self) {
		return function() {
			var changes = self._changes;
			var contents = [], i = 0;

			for (var k in changes) {
				if (changes.hasOwnProperty(k)) {
					contents.push(changes[k]);
				}
			}
			if (contents.length > 0) {
				handler(contents);
				self._changes = {};
			}
		};
	})(this));
	this._onContentChange = (function(self) {
		return function(evt, editable) {
			self.onContentChange(evt, editable);
		};
	})(this);
	this._changes = {};
}

function MediumCancelButton() {
	this.name = 'cancel';
	this.button = this._createButton('cancel', (function(self) {
		return function() {
			// TODO: 
			//self.base.lastContent
			// TODO: reset last state
		};
	})(this));
}

var SaveBtn = MediumSaveButton.prototype;
var CancelBtn = MediumCancelButton.prototype;

SaveBtn._createButton = CancelBtn._createButton = function(label, handler) {
	var button = document.createElement('button');
	button.className = 'medium-editor-action';
	button.innerHTML = label;
	button.onclick = handler;
	return button;
};

SaveBtn.onContentChange = function(evt, editable) {
	var doc = editable.getAttribute('data-cmsx-doc');
	var xpath = editable.getAttribute('data-cmsx-xpath');
	this._changes[doc + ':' + xpath] = {
		doc: doc,
		xpath: xpath,
		editable: editable
	};
};

SaveBtn.init = function() {
	this.base.subscribe('editableInput', this._onContentChange);
};

SaveBtn.destroy = function() {
	this.button.onclick = null;
	this.base.unsubscribe('editableInput', this._onContentChange);
};

CancelBtn.destroy = function() {
	this.button.onclick = null;
};

SaveBtn.getButton = CancelBtn.getButton = function() {
	return this.button;
};

SaveBtn.checkState = function(node) {
	// checkState is called multiple times for each selection change
	// so only store a value if the attribute was found
	if (!this.foundAttribute && node.getAttribute('data-edited')) {
		this.foundAttribute = true;
	}

	// Once we've moved up the ancestors to the container element
	// we know we're done iterating up and can add/remove the css class
	if (MediumEditor.util.isMediumEditorElement(node)) {
		if (this.foundAttribute) {
			node.classList.add('edited-text');
		} else {
			node.classList.remove('edited-text');
		}
		// Make sure the property is not persisted for the next time
		// selection is updated
		delete this.foundAttribute;
	}
};

SaveBtn.toXML = CancelBtn.toXML = function() {
	var xml = '';
	var serialized = this.base.serialize();

	for (var k in serialized) {
		if (serialized.hasOwnProperty(k)) {
			xml += serialized[k].value;
			console.log('serializing ' + k);
		}
	}

	return xml.replace(brFixPattern, '<br/>');
};

module.exports = {
	MediumSaveButton: MediumSaveButton,
	MediumCancelButton: MediumCancelButton
};


/*function serializeXML(xmlNode) {
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
}*/