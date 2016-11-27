var Overlay = require('./cmsx-overlay.js');
var ListView = require('./cmsx-list-view.js');

function ContextMenu(className) {
	Overlay.call(this, 'cmsx-context-menu' + (className ? ' ' + className : ''));
	this._handleOptionClick = this._handleOptionClick.bind(this);
	this._listView = new ListView(false, new ListView.Features()
		.itemClickable(this._handleOptionClick))
		.mount(this.contentElement());
}

var base = Overlay.prototype,
	contextMenu = ContextMenu.prototype = Object.create(base);

contextMenu.destroy = function() {
	base.destroy.call(this);
	this._listView.destroy();
	delete this._listView;
};

contextMenu.show = function(evt, context, options) {
	this._listView.setItems(options);
	this._context = context;
	base.show.call(this, evt);
	return this;
};

contextMenu.hide = function() {
	this._context = null;
	base.hide.call(this);
	return this;
};

contextMenu._handleOptionClick = function(option, evt) {
	option.callback(this._context, evt);
	this.hide();
};

var addOption = function addOption(label, callback) {
	this.push({label: label, callback: callback});
	return this;
};

ContextMenu.options = function() {
	var options = [];
	options.add = addOption;
	return options;
};

ContextMenu.show = Overlay.show;
ContextMenu.destroy = Overlay.destroy;
module.exports = ContextMenu;