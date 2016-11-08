var utils = require('./cmsx-utils.js');

function ContextMenu() {
	var el = this._element = document.createElement('ul');
	el.style.position = 'fixed';
	el.style.display = 'block';
	el.style.overflow = 'hidden';
	this._visible = false;
	this._items = [];
	document.body.appendChild(this._element);
	utils.bindAll(this);
	this._update();
}

var menu = ContextMenu.prototype;

menu.show = function(evt, optionContext, options) {
	this._optionContext = optionContext;
	this._options = options;

	if (options.length === 0) {
		this.hide();
		return;
	}

	var item, i, li, a;

	for (i = 0; i < options.length; i++) {
		if (this._items.length - 1 < i) {
			// Create element when none available for reuse
			a = document.createElement('a');
			a.setAttribute('data-option', i);
			a.addEventListener('click', this._handleOptionClick);
			li = document.createElement('li');
			li.appendChild(a);
			this._element.appendChild(li);
			item = {li: li, a: a, option: options[i]};
			this._items.push(item);
		} else {
			item = this._items[i];
		}

		// Set entry's label
		item.a.textContent = item.option.label;
	}

    // Remove unused elements
	if (options.length < this._items.length) {
		for (i = options.length; i < this._items.length; i++) {
			item = this._items[i];
			item.a.removeEventListener('click', this._handleOptionClick);
			this._element.removeChild(item.li);
		}

		this._items = this._items.slice(0, options.length);
	}

	this._position(evt);

	if (this._visible === false) {
		this._visible = true;
		this._update();
		document.body.addEventListener('keyup', this._handleEscapeKey);
		document.body.addEventListener('click', this.hide);
	}
};

menu.hide = function() {
	if (this._visible === true) {
		this._options = this._optionContext = null;
		this._visible = false;
		this._update();
		document.body.removeEventListener('keyup', this._handleEscapeKey);
		document.body.removeEventListener('click', this.hide);
	}
};

menu._update = function() {
	this._element.className = 'cmsx-context-menu' + (this._visible ? ' cmsx-context-menu-visible' : '');
	this._element.style.visibility = this._visible ? 'visible' : 'hidden';
};

menu._position = function(evt) {
	var el, dot, eventDoc, doc, body, pageX, pageY, menuWidth, menuHeight, mouseX, mouseY;
	evt = evt || window.event;

	// Get menu size
	el = this._element;
	el.style.left = '0px';
	el.style.top = '0px';
	menuWidth = el.offsetWidth;
	menuHeight = el.offsetHeight;

	// Get mouse position
	if (evt.pageX === undefined && evt.clientX !== undefined) {
        eventDoc = (evt.target && evt.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        mouseX = evt.clientX +
          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
          (doc && doc.clientLeft || body && body.clientLeft || 0);
        mouseY = evt.clientY +
          (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
          (doc && doc.clientTop  || body && body.clientTop  || 0 );
    } else {
    	mouseX = evt.pageX;
    	mouseY = evt.pageY;
	}

	el.style.left = mouseX + 'px';
	el.style.top = mouseY + 'px';
};

menu._handleOptionClick = function(evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement;
	evt.preventDefault();
	var option = this._options[el.getAttribute('data-option')];
	option.callback(this._optionContext, option);
};

menu._handleEscapeKey = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
};

menu.destroy = function() {
	this.hide();

	for (var i = 0; i < this._items.length; i++) {
		var item = this._items[i];
		item.a.removeEventListener('click', this._handleOptionClick);
		this._element.removeChild(item.li);
	}

	document.body.removeChild(this._element);
	this._options = this._optionContext = this._element = this._items = null;
};

module.exports = ContextMenu;