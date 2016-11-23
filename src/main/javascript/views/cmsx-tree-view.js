var ListView = require('./cmsx-list-view.js');

function TreeView(features) {
	var ancestorFeatures = function() {
		new ListView.Features().className('cmsx-tree-ancestors').apply(this);
		features.apply(this);
	},
	childrenFeatures = function() {
		new ListView.Features().className('cmsx-tree-children').apply(this);
		features.apply(this);
	};

	this._element = document.createElement('div');
	this._element.className = 'cmsx-tree';
	this._ancestors = new ListView(false, ancestorFeatures).mount(this._element);
	this._children = new ListView(true, childrenFeatures).mount(this._element);
	this._ancestors.context = this._children.context = this;
}

var tree = TreeView.prototype;

tree.mount = function(parentElement) {
	parentElement.appendChild(this._element);
	return this;
};

tree.destroy = function() {
	this._element.parentElement.removeChild(this._element);
	this._ancestors.destroy();
	this._children.destroy();
};

tree.clear = function() {
	this.setAncestors([]);
	this.setChildren([]);
};

tree.setAncestors = function(ancestors) {
	this._ancestors.setItems(ancestors);
};

tree.setChildren = function(children) {
	this._children.setItems(children);
};

tree.checked = function() {
	return this._children.checked();
};

tree._handleItemClick = function(onItemClick, item, evt) {
	onItemClick(item, evt, this);
};

tree._handleItemOptions = function(onItemOptions, item, evt) {
	onItemOptions(item, evt, this);
};

TreeView.Features = ListView.Features;
module.exports = TreeView;