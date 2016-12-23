var ListView = require('./cmsx-list-view.js');

function TreeView(features, className) {
	var ancestorFeatures = function() {
		new ListView.Features().className('cmsx-tree-ancestors').apply(this);
		features.apply(this);
	},
	childrenFeatures = function() {
		new ListView.Features().className('cmsx-tree-children').apply(this);
		features.apply(this);
	};

	this._element = document.createElement('div');
	this._element.className = 'cmsx-tree' + (className ? ' ' + className : '');
	this._ancestors = new ListView(false, ancestorFeatures);
	this._children = new ListView(true, childrenFeatures);
	this._element.appendChild(this._ancestors.element());
	this._element.appendChild(this._children.element());
}

var tree = TreeView.prototype;

tree.element = function() {
	return this._element;
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

TreeView.Features = ListView.Features;
module.exports = TreeView;