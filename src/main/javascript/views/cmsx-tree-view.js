var ListView = require('./cmsx-list-view.js');

function TreeView(parentElement, features) {
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
	this._ancestors = new ListView(this._element, false, ancestorFeatures);
	this._children = new ListView(this._element, true, childrenFeatures);
	this._ancestors.context = this._children.context = this;
	parentElement.appendChild(this._element);
}

TreeView.prototype.destroy = function() {
	this._element.parentElement.removeChild(this._element);
	this._ancestors.destroy();
	this._children.destroy();
};

TreeView.prototype.setAncestors = function(ancestors) {
	this._ancestors.setItems(ancestors);
};

TreeView.prototype.setChildren = function(children) {
	this._children.setItems(children);
};

TreeView.prototype.checked = function() {
	return this._children.checked();
};

TreeView.prototype._handleItemClick = function(onItemClick, item, evt) {
	onItemClick(item, evt, this);
};

TreeView.prototype._handleItemOptions = function(onItemOptions, item, evt) {
	onItemOptions(item, evt, this);
};

TreeView.Features = ListView.Features;
module.exports = TreeView;