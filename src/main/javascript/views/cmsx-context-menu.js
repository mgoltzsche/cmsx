var utils = require('../cmsx-utils.js');
var PopOut = require('./cmsx-pop-out.js');
var ListView = require('./cmsx-list-view.js');

function ContextMenu() {
	utils.bindAll(this);
	this.init('cmsx-context-menu');
	document.body.appendChild(this._element);
}

var menu = ContextMenu.prototype;

utils.decorate(menu, PopOut.prototype, {
	init: function(delegate, className) {
		delegate.call(this, className);
		this._listView = new ListView(false, new ListView.Features()
			.itemClickable(this._handleOptionClick))
			.mount(this.contentElement());
	},
	destroy: function(delegate) {
		delegate.call(this);
		this._listView.destroy();
		delete this._listView;
	},
	show: function(delegate, evt, context, options) {
		this._listView.setItems(options);
		this._context = context;
		delegate.call(this, evt);
	},
	hide: function(delegate) {
		this._context = null;
		delegate.call(this);
	}
});

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

ContextMenu.show = PopOut.show;
ContextMenu.destroy = PopOut.destroy;
module.exports = ContextMenu;