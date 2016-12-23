var ConfirmDialog = require('./cmsx-confirm-dialog.js');

function PromptDialog(className) {
	ConfirmDialog.call(this, 'cmsx-prompt-dialog' + (className ? ' ' + className : ''));
	this._input = document.createElement('input');
	this._input.type = 'text';
	this.contentElement().insertBefore(this._input, this._messageElement.nextSibling);
}

var base = ConfirmDialog.prototype,
	prompt = PromptDialog.prototype = Object.create(base);

prompt.applyLabel = 'apply';
prompt.cancelLabel = 'cancel';

prompt.show = function(evt, message, value, applyCallback, cancelCallback) {
	this._input.value = value;
	base.show.call(this, evt, message, applyCallback, cancelCallback);
};

prompt._handleApplyClick = function(evt) {
	evt.preventDefault();
	this._callback = this._applyCallback.bind(undefined, this._input.value, evt);
	this.hide(evt);
};

PromptDialog.prompt = ConfirmDialog.confirm;
PromptDialog.destroy = ConfirmDialog.destroy;
module.exports = PromptDialog;