var utils = require('../cmsx-utils.js');

/**
 * Constructs a light weight pop out dialog. Hides on document click.
 * Focusses on screen position. Usable as context or fly out menu.
 * 
 * @param className additional class name that should be set on root element
 * @returns the created PopOut instance
 */
function PopOut(className) {
	utils.bindAll(this);
	this.init(className);
	document.body.appendChild(this._element);
}

var popOut = PopOut.prototype;

popOut._axis = [
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

popOut.init = function(className) {
	this._className = className;
	this._visible = false;
	this._alignHorizontal = this._alignVertical = 'center';
	var el = this._element = document.createElement('div');
	el.style.position = 'fixed';
	el.style.display = 'block';
	el.style.overflow = 'hidden';
	this._update();
};

popOut.destroy = function() {
	this.hide();
	document.body.removeChild(this._element);
	this._element = null;
};

popOut.contentElement = function() {
	return this._element;
};

popOut.show = function(evt) {
	this.position(evt);

	if (this._visible === false) {
		this._visible = true;
		this._update();
		document.body.addEventListener('keyup', this._handleEscapeKey);
		document.body.addEventListener('click', this._handleDocumentClick, true);
		this._element.addEventListener('click', this._handleElementClick);
	}
};

popOut.hide = function() {
	if (this._visible === true) {
		this._visible = false;
		this._update();
		document.body.removeEventListener('keyup', this._handleEscapeKey);
		document.body.removeEventListener('click', this._handleDocumentClick, true);
		this._element.removeEventListener('click', this._handleElementClick);
	}
};

popOut._update = function() {
	this._element.className = 'cmsx-pop-out' +
		(this._className ? ' ' + this._className : '') +
		' cmsx-pop-out-' + this._alignVertical + '-' + this._alignHorizontal +
		(this._visible ? ' cmsx-pop-out-visible' : ' cmsx-pop-out-hidden');
	this._element.style.visibility = this._visible ? 'visible' : 'hidden';
};

popOut.position = function(evt) {
	evt = evt || window.event;
	var el, dot, eventDoc, doc, body, pageX, pageY, menuWidth, menuHeight, mouseX, mouseY;

	// Get content size
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

popOut._setValidPosition = function(axis, available, offsetLower, offsetHigher, required) {
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

popOut._isValidAxisValue = function(available, offset, required) {
	return offset >= 0 && available >= required && offset + required <= available;
};

popOut._handleDocumentClick = function(evt) {
	if (this._elementClicked) {
		this._elementClicked = false;
	} else {
		this.hide();
	}
};

popOut._handleElementClick = function(evt) {
	this._elementClicked = true;
};

popOut._handleEscapeKey = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
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

module.exports = PopOut;