var utils = require('../cmsx-utils.js');

function CmsxInput(id, label, type) {
	this._createElements(id, label, type);
}

var input = CmsxInput.prototype;

input._createElements = function(id, label, type) {
	this.id = id;
	var el = this._element = document.createElement('div'),
	labelContainer = document.createElement('div'),
	inputContainer = this._inputContainer = document.createElement('div');
	el.className = 'cmsx-input-container';
	labelContainer.textContent = label;
	labelContainer.className = 'cmsx-input-label';
	inputContainer.className = 'cmsx-input';
	this._createInputElement(id, label, type);
	el.appendChild(labelContainer);
	el.appendChild(inputContainer);
};

input._createInputElement = function(id, label, type) {
	var input = this._input = document.createElement('input');
	input.name = id;
	input.type = type || 'text';
	this._inputContainer.appendChild(input);
};

input.mount = function(parentElement, form) {
	this.form = form;
	parentElement.appendChild(this._element);
};

input.destroy = function() {
	if (this._element.parentElement) {
		this._element.parentElement.removeChild(this._element);
	}
};

input.set = function(values) {
	this._input.value = values[this.id] || '';
};

input.get = function(values) {
	var value = this._input.value;

	if (value) {
		values[this.id] = value;
	}

	return values;
};

function CmsxInitialInput(id, label, type) {
	this._createElements(id, label, type);
}

utils.decorate(CmsxInitialInput.prototype, input, {
	set: function(delegate, values) {
		delegate.call(this, values);
		this._input.disabled = values[this.id] !== undefined;
	}
});


function CmsxPickableInput(id, label, type, onPick) {
	this.setValue = this.setValue.bind(this);
	this._handlePickClick = this._handlePickClick.bind(this, onPick);
	this._createElements(id, label, type);
	var btn = this._pickButton = document.createElement('a');
	btn.title = 'pick';
	btn.className = 'cmsx-button cmsx-button-pick';
	btn.addEventListener('click', this._handlePickClick);
	this._inputContainer.appendChild(btn);
}

var pickableInput = utils.extend(CmsxPickableInput.prototype, input);

pickableInput._handlePickClick = function(onPick, evt) {
	evt.preventDefault();
	onPick(this.setValue, this._value || '');
};

pickableInput.setValue = function(value) {
	this._value = value;
	this._input.value = value || '';
};

pickableInput.destroy = function() {
	this._pickButton.removeEventListener('click', this._handlePickClick);

	if (this._element.parentElement) {
		this._element.parentElement.removeChild(this._element);
	}
};


function CmsxFormButton(id, label, primary, callback) {
	this._handleClick = this._handleClick.bind(this, callback);
	var btn = this._element = document.createElement('a');
	btn.textContent = label;
	btn.className = 'cmsx-button' + (primary ? ' cmsx-primary' : '');
	btn.addEventListener('click', this._handleClick);
}
var button = utils.extend(CmsxFormButton.prototype, input);

button._handleClick = function(callback, evt) {
	callback(this.form, evt);
};
button.destroy = function() {
	if (this._element.parentElement) {
		this._element.parentElement.removeChild(this._element);
	}
	this._element.removeEventListener('click', this._handleClick);
};
button.set = function() {};
button.get = function(values) {return values;};


function CmsxForm(onChange) {
	this._inputs = {};
	this._values = {};
	this._element = document.createElement('form');
	this._element.className = 'cmsx-form';
	this._idCount = 0;
}

var form = CmsxForm.prototype;

form.addInput = function(id, label, type) {
	this.add(new CmsxInput(id, label, type));
	return this;
};

form.addInitialInput = function(id, label, type) {
	this.add(new CmsxInitialInput(id, label, type));
	return this;
};

form.addPickableInput = function(id, label, type, onPick) {
	this.add(new CmsxPickableInput(id, label, type, onPick));
	return this;
};

form.addButton = function(label, primary, callback) {
	this.add(new CmsxFormButton('btn' + (this._idCount++), label, primary, callback));
	return this;
};

form.add = function(input) {
	if (this._inputs[input.id])
		throw 'Cannot add input with duplicate ID: ' + input.id;

	input.mount(this._element, this);
	this._inputs[input.id] = input;
	return this;
};

form.remove = function(input) {
	input = this._inputs[input.id];
	input.destroy();
	delete this._inputs[input.id];
	return this;
};

form.mount = function(parentElement, form) {
	this.form = form || this;
	parentElement.appendChild(this._element);
};

form.destroy = function() {
	for (var k in this._inputs) {
		if (this._inputs.hasOwnProperty(k)) {
			this.remove(this._inputs[k]);
		}
	}

	if (this._element.parentElement) {
		this._element.parentElement.removeChild(this._element);
	}

	delete this._inputs;
	delete this._element;
};

form.set = function(values) {
	this._values = values;
	for (var k in this._inputs) {
		if (this._inputs.hasOwnProperty(k)) {
			this._inputs[k].set(values);
		}
	}
};

form.get = function(values) {
	values = values || this._values;
	for (var k in this._inputs) {
		if (this._inputs.hasOwnProperty(k)) {
			this._inputs[k].get(values);
		}
	}
	return values;
};

CmsxForm.CmsxInput = CmsxInput;
CmsxForm.CmsxFormButton = CmsxFormButton;
module.exports = CmsxForm;