var Overlay = require('./cmsx-overlay.js');
var ListView = require('./cmsx-list-view.js');

function ContextMenu(className) {
	Overlay.call(this, 'cmsx-context-menu' + (className ? ' ' + className : ''));
	this._handleOptionClick = this._handleOptionClick.bind(this);
	this._list = new ListView(false, new ListView.Features()
		.itemClickable(this._handleOptionClick));
	this.add(this._list);
}

var base = Overlay.prototype,
	contextMenu = ContextMenu.prototype = Object.create(base);

contextMenu.show = function(evt, context, options) {
	this._list.setItems(options);
	this._context = context;
	return base.show.call(this, evt);
};

contextMenu.hide = function() {
	this._context = null;
	return base.hide.call(this);
};

contextMenu._handleOptionClick = function(evt, option) {
	option.callback(evt, this._context);
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