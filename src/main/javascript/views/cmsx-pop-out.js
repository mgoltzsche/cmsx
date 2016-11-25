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
	evt.stopPropagation();

	if (this._visible === false) {
		this._visible = true;
		document.body.addEventListener('keyup', this._handleEscapeKey);
		document.body.addEventListener('click', this._handleDocumentClick);
		this._element.addEventListener('click', this._handleElementClick);
	}

	evt = evt || window.event;
	this.positionAtElement(evt.target || evt.srcElement);
};

popOut.hide = function() {
	if (this._visible === true) {
		this._visible = false;
		this._update();
		document.body.removeEventListener('keyup', this._handleEscapeKey);
		document.body.removeEventListener('click', this._handleDocumentClick);
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

popOut.positionAtElement = function(element) {
	var container, menuWidth, menuHeight, offsetX, offsetYmouseX, mouseY, relX, relY, lowX, lowY, highX, highY;

	// Get content size
	container = this._element;
	container.style.left = '0px';
	container.style.top = '0px';
	menuWidth = container.offsetWidth;
	menuHeight = container.offsetHeight;

	elWidth = element.offsetWidth;
	elHeight = element.offsetHeight;

	// Get element position relative to view port
	if (element.getBoundingClientRect) {
		// ECMAScript 5 required: Includes CSS3 transforms
		var rect = element.getBoundingClientRect();
		vpX = rect.left;
		vpY = rect.top;
	} else {
		// Fallback: No CSS3 transforms supported
		offsetX = offsetY = 0;
		while (element) {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
			element = element.offsetParent;
		}
	
		vpX = offsetX - (window.scrollX || window.pageXOffset || document.body.scrollLeft);
		vpY = offsetY - (window.scrollY || window.pageYOffset || document.body.scrollTop);
	}

	this._setValidPosition(this._axis[0], window.innerWidth, vpX, vpX + elWidth, menuWidth);
	this._setValidPosition(this._axis[1], window.innerHeight, vpY, vpY + elHeight, menuHeight);
	this._update();
};

popOut.position = function(evt) {
	evt = evt || window.event;
	var el, menuWidth, menuHeight, mouseX, mouseY;

	// Get content size
	el = this._element;
	el.style.left = '0px';
	el.style.top = '0px';
	menuWidth = el.offsetWidth;
	menuHeight = el.offsetHeight;
	mouseX = evt.clientX;
	mouseY = evt.clientY;

	this._setValidPosition(this._axis[0], window.innerWidth, mouseX, mouseX, menuWidth);
	this._setValidPosition(this._axis[1], window.innerHeight, mouseY, mouseY, menuHeight);
	this._update();
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
	console.log('document click');
	this.hide();
};

popOut._handleElementClick = function(evt) {
	console.log('element click');
	evt.stopPropagation();
};

popOut._handleEscapeKey = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
};

module.exports = PopOut;