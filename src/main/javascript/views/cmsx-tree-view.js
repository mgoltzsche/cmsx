var ListView = require('./cmsx-list-view.js');

function TreeView(parentElement, prefs) {
	var ancestorDecorators = [], childrenDecorators = [];

	ancestorDecorators.push(ListView.className('cmsx-tree-ancestors'));
	childrenDecorators.push(ListView.className('cmsx-tree-children'));

	if (prefs.checkable) {
		childrenDecorators.push(ListView.itemCheckable());
		childrenDecorators.push(ListView.toolbarButton('test', function(evt, listView) {
			console.log('list toolbar button clicked');
			console.log(listView.checked());
		}));
	}

	if (prefs.onItemClick) {
		var clickable = ListView.itemClickable(this._handleItemClick.bind(this, prefs.onItemClick));
		ancestorDecorators.push(clickable);
		childrenDecorators.push(clickable);
	}

	if (prefs.onItemOptions) {
		var options = ListView.itemOptions(this._handleItemOptions.bind(this, prefs.onItemOptions));
		ancestorDecorators.push(options);
		childrenDecorators.push(options);
	}

	this._element = document.createElement('div');
	this._element.className = 'cmsx-tree';
	this._ancestors = new ListView(this._element, [], ancestorDecorators);
	this._children = new ListView(this._element, [], childrenDecorators);
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

module.exports = TreeView;