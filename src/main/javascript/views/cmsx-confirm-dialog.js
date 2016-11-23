var utils = require('../cmsx-utils.js');
var Dialog = require('./cmsx-dialog.js');

function ConfirmDialog() {
	utils.bindAll(this);
	this._dialog = Dialog.create();
	var el = this._dialog.contentElement(),
		buttonsElement = document.createElement('div');
	this._applyButton = document.createElement('a');
	this._cancelButton = document.createElement('a');
	this._messageElement = document.createElement('div');
	this._applyButton.textContent = this.okayLabel;
	this._cancelButton.textContent = this.cancelLabel;
	buttonsElement.className = 'cmsx-buttons';
	this._applyButton.className = 'cmsx-button cmsx-primary cmsx-button-apply';
	this._cancelButton.className = 'cmsx-button cmsx-button-cancel';
	this._applyButton.addEventListener('click', this._handleApplyClick);
	this._cancelButton.addEventListener('click', this._handleCancelClick);
	buttonsElement.appendChild(this._applyButton);
	buttonsElement.appendChild(this._cancelButton);
	el.appendChild(this._messageElement);
	el.appendChild(buttonsElement);
}

var confirm = ConfirmDialog.prototype;

confirm.okayLabel = 'okay';
confirm.cancelLabel = 'cancel';

confirm.destroy = function() {
	this._applyButton.removeEventListener('click', this._handleApplyClick);
	this._cancelButton.removeEventListener('click', this._handleCancelClick);
	this._dialog.destroy();
	this._listView.destroy();
	this._applyCallback = this._cancelCallback = null;
	delete this._dialog;
};

confirm.confirm = function(message, applyCallback, cancelCallback, evt) {
	this._messageElement.textContent = message;
	this._applyCallback = applyCallback || this._fallback;
	this._cancelCallback = cancelCallback || this._fallback;
	this._dialog.show(evt);
};

confirm._fallback = function() {};

confirm._handleApplyClick = function(evt) {
	var callback = this._applyCallback;
	this._applyCallback = this._cancelCallback = null;
	evt.preventDefault();
	this._dialog.hide();
	callback(evt);
};

confirm._handleCancelClick = function(evt) {
	var callback = this._cancelCallback;
	this._applyCallback = this._cancelCallback = null;
	evt.preventDefault();
	this._dialog.hide();
	callback(evt);
};

ConfirmDialog.confirm = function(message, applyCallback, cancelCallback, evt) {
	if (!this._instance) {
		this._instance = new this();
		this._instance.destroy = function(destroy) {
			var dialog = this._instance;
			this._instance = null;
			destroy.call(dialog);
		}.bind(this, this._instance.destroy);
	}

	this._instance.confirm(message, applyCallback, cancelCallback, evt);
	return this._instance;
}.bind(ConfirmDialog);

ConfirmDialog.destroy = function() {
	if (this._instance) {this._instance.destroy();}
}.bind(ConfirmDialog);

module.exports = ConfirmDialog;