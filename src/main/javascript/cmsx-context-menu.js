var utils = require('./cmsx-utils.js');

function ContextMenu(options) {
	var el = this._element = document.createElement('ul');
	el.style.position = 'fixed';
	el.style.display = 'block';
	el.style.overflow = 'hidden';
	this._visible = false;
	this._items = [];
	this._alignHorizontal = this._alignVertical = 'center';
	document.body.appendChild(this._element);
	utils.bindAll(this);
	this.setOptions(options);
	this._update();
}

var menu = ContextMenu.prototype;

menu._axis = [
	{
		alignProp: '_alignHorizontal',
		styleProp: 'left',
		classes: ['left', 'right']
	},
	{
		alignProp: '_alignVertical',
		styleProp: 'top',
		classes: ['top', 'bottom']
	}
];

menu.destroy = function() {
	this.hide();

	for (var i = 0; i < this._items.length; i++) {
		var item = this._items[i];
		item.a.removeEventListener('click', this._handleOptionClick);
		this._element.removeChild(item.li);
	}

	document.body.removeChild(this._element);
	this._options = this._context = this._element = this._items = null;
};

menu.setOptions = function(options) {
	this._options = options || [];

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
};

menu.show = function(evt, context) {
	this._context = context;
	this._position(evt);

	if (this._visible === false) {
		this._visible = true;
		this._update();
		document.body.addEventListener('keyup', this._handleEscapeKey);
		document.body.addEventListener('click', this._handleDocumentClick);
		this._element.addEventListener('click', this._handleElementClick, true);
	}
};

menu.hide = function() {
	if (this._visible === true) {
		this._context = null;
		this._visible = false;
		this._update();
		document.body.removeEventListener('keyup', this._handleEscapeKey);
		document.body.removeEventListener('click', this._handleDocumentClick);
		this._element.removeEventListener('click', this._handleElementClick, true);
	}
};

menu._update = function() {
	this._element.className = 'cmsx-context-menu ' +
		'cmsx-context-menu-' + this._alignVertical + '-' + this._alignHorizontal +
		(this._visible ? ' cmsx-context-menu-visible' : '');
	this._element.style.visibility = this._visible ? 'visible' : 'hidden';
};

menu._position = function(evt) {
	var el, dot, eventDoc, doc, body, pageX, pageY, menuWidth, menuHeight, mouseX, mouseY;
	evt = evt || window.event;

	// TODO: move into setOptions method
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

	this._setValidPosition(this._axis[0], window.innerWidth, mouseX, mouseX, menuWidth);
	this._setValidPosition(this._axis[1], window.innerHeight, mouseY, mouseY, menuHeight);
};

menu._setValidPosition = function(axis, available, offsetLower, offsetHigher, required) {
	var pos;
	if (this._isValidAxisValue(available, offsetHigher, required)) {
		// Set higher (right/bottom)
		pos = offsetHigher;
		this[axis.alignProp] = axis.classes[1];
	} else if (this._isValidAxisValue(available, offsetLower - required, required)) {
		// Set lower (left/top)
		pos = offsetLower - required;
		this[axis.alignProp] = axis.classes[0];
	} else {
		// Fallback: center
		pos = available / 2 - required / 2;
		this[axis.alignProp] = 'center';
	}

	this._element.style[axis.styleProp] = pos + 'px';
};

menu._isValidAxisValue = function(available, offset, required) {
	return offset >= 0 && available >= required && offset + required <= available;
};

menu._handleDocumentClick = function(evt) {
	if (this._elementClicked) {
		this._elementClicked = false;
	} else {
		this.hide();
	}
};

menu._handleElementClick = function(evt) {
	this._elementClicked = true;
};

menu._handleOptionClick = function(evt) {
	evt = evt || window.event;
	var ctx, option, el = evt.target || evt.srcElement;
	evt.preventDefault();
	ctx = this._context;
	option = this._options[el.getAttribute('data-option')];
	option.callback(ctx, option);
	this.hide();
};

menu._handleEscapeKey = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
};

module.exports = ContextMenu;