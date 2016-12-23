var Dialog = require('./cmsx-dialog.js');

function ConfirmDialog(className) {
	Dialog.call(this, 'cmsx-dialog-layer-2 cmsx-confirm-dialog' + (className ? ' ' + className : ''));
	this._handleApplyClick = this._handleApplyClick.bind(this);
	this._handleCancelClick = this._handleCancelClick.bind(this);
	var el = this.contentElement(),
		buttonsElement = document.createElement('div');
	this._applyButton = document.createElement('a');
	this._cancelButton = document.createElement('a');
	this._messageElement = document.createElement('div');
	this._applyButton.textContent = this.applyLabel;
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
	this.prefWidth = 600;
}

var base = Dialog.prototype,
	confirm = ConfirmDialog.prototype = Object.create(base);

confirm.applyLabel = 'yes';
confirm.cancelLabel = 'no';

confirm.destroy = function() {
	base.destroy.call(this);
	this._applyButton.removeEventListener('click', this._handleApplyClick);
	this._cancelButton.removeEventListener('click', this._handleCancelClick);
};

confirm.show = function(evt, message, applyCallback, cancelCallback) {
	this._messageElement.textContent = message || '';
	this._applyCallback = applyCallback || this._fallback;
	this._callback = this._cancelCallback = cancelCallback || this._fallback;
	base.show.call(this, evt);
};

confirm._fallback = function() {};

confirm.hide = function(evt) {
	base.hide.call(this, evt);
	var callback = this._callback;
	this._callback = this._applyCallback = this._cancelCallback = this._fallback;
	callback(evt);
};

confirm._handleApplyClick = function(evt) {
	evt.preventDefault();
	this._callback = this._applyCallback;
	this.hide(evt);
};

confirm._handleCancelClick = function(evt) {
	evt.preventDefault();
	this.hide(evt);
};

ConfirmDialog.confirm = Dialog.show;
ConfirmDialog.destroy = Dialog.destroy;
module.exports = ConfirmDialog;