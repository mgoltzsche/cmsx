function ListView(toolbarSupported, features, items) {
	this.toolbarSupported = !!toolbarSupported;
	this._element = document.createElement('div');
	this._element.className = 'cmsx-list-container';
	this._listElement = document.createElement('ul');
	this._listElement.className = 'cmsx-list';
	this._element.appendChild(this._listElement);
	this._itemViews = [];
	this._itemRenderer = new ListItemRenderer();
	this.destroy = this.destroy.bind(this);
	this.setItems = this.setItems.bind(this);
	features.apply(this);

	this.setItems(items);
	this._element.appendChild(this._listElement);
}

var list = ListView.prototype;

list.element = function() {
	return this._element;
};

list.destroy = function() {
	this._element.parentElement.removeChild(this._element);
	this.setItems([]);
	this._element = this._listElement = this._itemRenderer = this._itemViews = this._items = null;
};

list.setItems = function(items) {
	items = items || [];

	if (this._items === items) return;

	this._items = items;
	var itemView, i, li, a, item;

	for (i = 0; i < items.length; i++) {
		if (this._itemViews.length - 1 < i) {
			// Create item element when none available for reuse
			itemView = {index: i};
			this._itemRenderer.createItem(itemView);
			this._listElement.appendChild(itemView.element);
			this._itemViews.push(itemView);
		} else {
			itemView = this._itemViews[i];
		}

		// Update item elements
		item = items[i];
		if (itemView.item !== item) {
			itemView.item = item;
			this._itemRenderer.updateItem(itemView);
		}
	}

    // Remove unused item elements
	if (items.length < this._itemViews.length) {
		for (i = items.length; i < this._itemViews.length; i++) {
			itemView = this._itemViews[i];
			this._listElement.removeChild(itemView.element);
			this._itemRenderer.destroyItem(itemView);
		}

		this._itemViews = this._itemViews.slice(0, items.length);
	}
};

list.getItemIndex = function(element) {
	while (element) {
		if ((' ' + element.className + ' ').indexOf(' cmsx-list-item ') > -1) {
			return parseInt(element.getAttribute('data-item'));
		}
		element = element.parentElement;
	}
	throw 'Item element not found for given element: ' + element;
};

list.toolbar = function() {
	if (!this._toolbar) {
		this._toolbar = document.createElement('div');
		this._toolbar.className = 'cmsx-toolbar';
		this._element.className += ' cmsx-list-with-toolbar';
		this._element.prepend(this._toolbar);
	}

	return this._toolbar;
};


function ListItemRenderer() {}

var itemRenderer = ListItemRenderer.prototype;

itemRenderer.createItem = function(itemView) {
	itemView.element = document.createElement('li');
	itemView.element.className = 'cmsx-list-item';
	itemView.label = itemView.element;
};

itemRenderer.updateItem = function(itemView) {
	itemView.label.textContent = itemView.item.label;
};

itemRenderer.destroyItem = function() {};


function ListItemLinkRenderer(delegate, listView, onItemClick) {
	this._delegate = delegate;
	this._listView = listView;
	this._onItemClick = onItemClick;
	this._handleItemClick = this._handleItemClick.bind(this);
}

var linkDecorator = ListItemLinkRenderer.prototype;

linkDecorator.createItem = function(itemView) {
	this._delegate.createItem(itemView);
	itemView.element.setAttribute('data-item', itemView.index);
	itemView.label = document.createElement('a');
	itemView.label.className = 'cmsx-item-label';
	itemView.label.addEventListener('click', this._handleItemClick);
	itemView.element.appendChild(itemView.label);
};

linkDecorator.updateItem = function(itemView) {
	this._delegate.updateItem(itemView);
	itemView.label.title = itemView.item.description || '';
};

linkDecorator.destroyItem = function(itemView) {
	this._delegate.destroyItem(itemView);
	itemView.label.removeEventListener('click', this._handleItemClick);
};

linkDecorator._handleItemClick = function(evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement,
		item = this._listView._itemViews[el.parentElement.getAttribute('data-item')].item;
	evt.preventDefault();
	this._listView.clickedItem = item;
	this._onItemClick(evt, item);
};


function ListItemOptionsRenderer(delegate, listView, onItemButtonClick) {
	this._delegate = delegate;
	this._listView = listView;
	this._onItemButtonClick = onItemButtonClick;
	this._handleItemButtonClick = this._handleItemButtonClick.bind(this);
}

var optionsDecorator = ListItemOptionsRenderer.prototype;

optionsDecorator.createItem = function(itemView) {
	this._delegate.createItem(itemView);
	itemView.element.setAttribute('data-item', itemView.index);
	itemView.optionsButton = document.createElement('a');
	itemView.optionsButton.className = 'cmsx-item-options';
	itemView.optionsButton.addEventListener('click', this._handleItemButtonClick);
	itemView.element.appendChild(itemView.optionsButton);
};

optionsDecorator.updateItem = function(itemView) {
	this._delegate.updateItem(itemView);
};

optionsDecorator.destroyItem = function(itemView) {
	this._delegate.destroyItem(itemView);
	itemView.optionsButton.removeEventListener('click', this._handleItemButtonClick);
};

optionsDecorator._handleItemButtonClick = function(evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement,
		item = this._listView._itemViews[el.parentElement.getAttribute('data-item')].item;
	evt.preventDefault();
	this._onItemButtonClick(evt, item);
};


function ListItemCheckboxRenderer(delegate, listView) {
	this._delegate = delegate;
	this._listView = listView;
	this._checkedCount = 0;
	this._handleItemChange = this._handleItemChange.bind(this);
	this._handleAllItemsChange = this._handleAllItemsChange.bind(this);
	this.checked = this.checked.bind(this);
	listView.checked = this.checked;
	listView._element.className += ' cmsx-list-container-checkable';
	listView._allCheckbox = document.createElement('input');
	listView._allCheckbox.type = 'checkbox';
	listView.toolbar().prepend(listView._allCheckbox);
	listView._allCheckbox.addEventListener('change', this._handleAllItemsChange);
	listView.destroy = function(listDestroy) {
		listDestroy();
		this._listView._allCheckbox.removeEventListener('change', this._handleAllItemsChange);
		this._listView._allCheckbox = null;
	}.bind(this, listView.destroy);
	listView.setItems = function(setItems, items) {
		this._checkedCount = 0;
		setItems(items);
		this._update();
	}.bind(this, listView.setItems);
}

var checkboxDecorator = ListItemCheckboxRenderer.prototype;

checkboxDecorator.createItem = function(itemView) {
	this._delegate.createItem(itemView);
	itemView.element.setAttribute('data-item', itemView.index);
	itemView.checkbox = document.createElement('input');
	itemView.checkbox.type = 'checkbox';
	itemView.checkbox.className = 'cmsx-item-checkbox';
	itemView.checkbox.addEventListener('change', this._handleItemChange);
	itemView.element.appendChild(itemView.checkbox);
};

checkboxDecorator.updateItem = function(itemView) {
	this._delegate.updateItem(itemView);
	var checked = !!itemView.item.checked;
	itemView.checkbox.checked = checked;
	if (checked) this._checkedCount++;
};

checkboxDecorator.destroyItem = function(itemView) {
	this._delegate.destroyItem(itemView);
	itemView.checkbox.removeEventListener('change', this._handleItemChange);
};

checkboxDecorator.checked = function() {
	if (arguments.length === 0) {
		var i, item, checked = [], items = this._listView._items;
		for (i = 0; i < items.length; i++) {
			item = items[i];
			if (item.checked) {
				checked.push(item);
			}
		}
		return checked;
	} else {
		this.checkAll(arguments[0]);
	}
};

checkboxDecorator.checkAll = function(checked) {
	if (checked && this._checkedCount === this._listView._items.length ||
			!checked && this._checkedCount === 0) {
		return; // Already all (un)checked
	}

	var i, itemView, itemViews = this._listView._itemViews;
	for (i = 0; i < itemViews.length; i++) {
		itemView = itemViews[i];
		itemView.item.checked = checked;
		itemView.checkbox.checked = checked;
	}
	this._checkedCount = checked ? itemViews.length : 0;
	this._update();
};

checkboxDecorator._handleAllItemsChange = function(evt) {
	evt = evt || window.event;
	evt.preventDefault();
	this.checkAll((evt.target || evt.srcElement).checked);
};

checkboxDecorator._handleItemChange = function(evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement,
		item = this._listView._itemViews[el.parentElement.getAttribute('data-item')].item,
		checked = el.checked;
	evt.preventDefault();
	if (checked == item.checked) return;
	item.checked = checked;
	this._checkedCount += checked ? 1 : -1;
	this._update();
};

checkboxDecorator._update = function() {
	var items = this._listView._items;
	this._listView.toolbar().className = 'cmsx-toolbar ' + (this._checkedCount > 0 ? 'cmsx-list-checked' : 'cmsx-list-unchecked');
	this._listView._allCheckbox.checked = items.length > 0 && this._checkedCount === items.length;
	this._listView._allCheckbox.disabled = items.length === 0;
};


function ListItemOrderableRenderer(delegate, listView, onItemOrderChanged) {
	this._delegate = delegate;
	this._listView = listView;
	this._onItemOrderChanged = onItemOrderChanged;
	this._handleItemMouseUp = this._handleItemMouseUp.bind(this);
	this._handleItemMouseOver = this._handleItemMouseOver.bind(this);
	this._handleItemDragStart = this._handleItemDragStart.bind(this);
	this._handleDocumentMouseUp = this._handleDocumentMouseUp.bind(this);
	this._dragIndex = null;
}

var orderableDecorator = ListItemOrderableRenderer.prototype;

orderableDecorator.createItem = function(itemView) {
	this._delegate.createItem(itemView);
	itemView.element.setAttribute('data-item', itemView.index);
	itemView.drag = document.createElement('span');
	itemView.drag.textContent = '#';
	itemView.drag.className = 'cmsx-item-drag';
	itemView.drag.addEventListener('mousedown', this._handleItemDragStart);
	itemView.element.addEventListener('mouseover', this._handleItemMouseOver);
	itemView.element.addEventListener('mouseup', this._handleItemMouseUp);
	itemView.element.appendChild(itemView.drag);
};

orderableDecorator.updateItem = function(itemView) {
	this._delegate.updateItem(itemView);
};

orderableDecorator.destroyItem = function(itemView) {
	this._delegate.destroyItem(itemView);
	itemView.drag.removeEventListener('mousedown', this._handleItemDragStart);
	itemView.element.removeEventListener('mouseover', this._handleItemMouseOver);
	itemView.element.removeEventListener('mouseup', this._handleItemMouseUp);
};

orderableDecorator._handleItemDragStart = function(evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement,
		itemIndex = parseInt(el.parentElement.getAttribute('data-item'));
	this._origItems = this._listView._items; // TODO: set back after failed move
	evt.preventDefault();

	this._dragIndex = itemIndex;
	this._dropIndex = null;
	document.addEventListener('mouseup', this._handleDocumentMouseUp);
};

orderableDecorator._handleItemMouseOver = function(evt) {
	if (this._dragIndex === null) return;
	evt = evt || window.event;
	var itemIndex = this._listView.getItemIndex(evt.target || evt.srcElement);
	if (itemIndex !== this._dropIndex) {
		this._dropIndex = itemIndex;
		this._moveItem();
	}
};

orderableDecorator._handleItemMouseUp = function(evt) {
	if (this._dragIndex === null) return;
	evt = evt || window.event;
	evt.preventDefault();
	evt.stopPropagation();
	this._dropIndex = this._listView.getItemIndex(evt.target || evt.srcElement);
	if (this._moveItem() && this._dropIndex !== this._dragIndex) {
		this._onItemOrderChanged(this._listView._items, this._dropIndex);
	} else {
		this._listView.setItems(this._origItems);
	}
	this._dragIndex = this._dropIndex = this._origItems = null;
	document.removeEventListener('mouseup', this._handleDocumentMouseUp);
};

orderableDecorator._handleDocumentMouseUp = function(evt) {
	this._listView.setItems(this._origItems);
	this._dragIndex = this._dropIndex = this._origItems = null;
	document.removeEventListener('mouseup', this._handleDocumentMouseUp);
};

orderableDecorator._moveItem = function() {
	var i, items = this._origItems, newItems = [],
		itemPos = this._dragIndex, itemDestPos = this._dropIndex, item = items[itemPos];
	if (itemDestPos === null || !item) return false;
	itemDestPos = itemDestPos > itemPos ? itemDestPos + 1 : itemDestPos;
	for (i = 0; i < items.length; i++) {
		if (itemDestPos === i) {
			newItems.push(item);
		}
		if (itemPos !== i) {
			newItems.push(items[i]);
		}
	}
	if (itemDestPos >= items.length) {
		newItems.push(item);
	}
	this._listView.setItems(newItems);
	return true;
};


function ListFeatures(apply) {
	if (apply) this.apply = apply;
}

ListFeatures.prototype.apply = function(itemView) {};

ListFeatures.prototype.className = function(className) {
	return new ListFeatures(function(apply, listView) {
		listView._element.className += ' ' + className;
		apply(listView);
	}.bind(undefined, this.apply));
};

ListFeatures.prototype.itemClickable = function(onClick) {
	return new ListFeatures(function(apply, listView) {
		listView._itemRenderer = new ListItemLinkRenderer(listView._itemRenderer, listView, onClick);
		apply(listView);
	}.bind(undefined, this.apply));
};

ListFeatures.prototype.itemOptions = function(onClick) {
	return new ListFeatures(function(apply, listView) {
		listView._itemRenderer = new ListItemOptionsRenderer(listView._itemRenderer, listView, onClick);
		apply(listView);
	}.bind(undefined, this.apply));
};

ListFeatures.prototype.itemCheckable = function() {
	return new ListFeatures(function(apply, listView) {
		if (listView.toolbarSupported) {
			listView._itemRenderer = new ListItemCheckboxRenderer(listView._itemRenderer, listView);
		}
		apply(listView);
	}.bind(undefined, this.apply));
};

ListFeatures.prototype.orderable = function(onOrderChange) {
	return new ListFeatures(function(apply, listView) {
		listView._itemRenderer = new ListItemOrderableRenderer(listView._itemRenderer, listView, onOrderChange);
		apply(listView);
	}.bind(undefined, this.apply));
};

ListFeatures.prototype.toolbarButton = function(label, callback, className) {
	return new ListFeatures(function(apply, listView) {
		apply(listView);

		if (!listView.toolbarSupported) return;

		listView.className += ' cmsx-list-container-with-toolbar';
		var btn = document.createElement('a'),
			clickHandler = function(evt) {
				evt = evt || window.event;
				evt.preventDefault();
				callback(evt);
			};

		if (!listView._buttonBar) { // Create button bar
			listView._buttonBar = document.createElement('div');
			listView._buttonBar.className = 'cmsx-list-button-bar';
			listView.toolbar().appendChild(listView._buttonBar);
		}

		btn.textContent = label;
		btn.className = 'cmsx-button cmsx-toolbar-button' + (className ? ' ' + className : '');
		btn.addEventListener('click', clickHandler);
		listView._buttonBar.appendChild(btn);
		listView.destroy = function(listDestroy, clickHandler) {
			listDestroy();
			this.removeEventListener('click', clickHandler);
		}.bind(btn, listView.destroy, clickHandler);
	}.bind(undefined, this.apply));
};

ListView.Features = ListFeatures;
module.exports = ListView;