var utils = require('../cmsx-utils.js');
var PopOut = require('./cmsx-pop-out.js');
var ListView = require('./cmsx-list-view.js');

function ContextMenu() {
	utils.bindAll(this);
	this.init('cmsx-context-menu');
	document.body.appendChild(this._element);
}

var base = PopOut.prototype;
var menu = utils.extend(ContextMenu.prototype, base);

menu.init = function(className) {
	base.init.call(this, className);
	this._listView = new ListView(false, new ListView.Features()
		.itemClickable(this._handleOptionClick))
		.mount(this.contentElement());
};

menu.destroy = function() {
	base.destroy.call(this);
	this._listView.destroy();
	delete this._listView;
};

menu.show = function(evt, context, options) {
	this._listView.setItems(options);
	this._context = context;
	base.show.call(this, evt);
};

menu.hide = function() {
	this._context = null;
	base.hide.call(this);
};

menu._handleOptionClick = function(option, evt) {
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

PopOut.show = function() {
	if (!this._instance) {
		this._instance = new this();
	}

	this._instance.show.apply(this._instance, Array.prototype.slice.call(arguments));
};

PopOut.destroy = function() {
	if (this._instance) {
		this._instance.destroy();
	}
};

ContextMenu.show = PopOut.show;
ContextMenu.destroy = PopOut.destroy;
module.exports = ContextMenu;