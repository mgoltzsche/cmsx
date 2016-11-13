var utils = require('../cmsx-utils.js');
var PopOut = require('./cmsx-pop-out.js');
var ListView = require('./cmsx-list-view.js');

function ContextMenu(options) {
	utils.bindAll(this);
	this._popOut = new PopOut('cmsx-context-menu');
	var el = this._popOut.contentElement(),
		clickable = ListView.itemClickable(this._handleOptionClick);
	this._listView = new ListView(el, options, clickable);
	this.setOptions(options);
}

var menu = ContextMenu.prototype;

menu.destroy = function() {
	this._popOut.destroy();
	this._listView.destroy();
	delete this._popOut;
	delete this._listView;
};

menu.setOptions = function(options) {
	this._listView.setItems(options);
};

menu.show = function(evt, context) {
	this._context = context;
	this._popOut.show(evt);
};

menu.hide = function() {
	this._popOut.hide();
	this._context = null;
};

menu._handleOptionClick = function(option, evt) {
	option.callback(this._context, evt);
	this.hide();
};

module.exports = ContextMenu;