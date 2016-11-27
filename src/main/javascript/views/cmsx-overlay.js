var TransitionAnimation = require('./cmsx-transition-animation.js');

/**
 * Constructs a fixed positioned overlay that hides on document click.
 * 
 * @param className additional class name that should be set on root element
 */
function Overlay(className) {
	this.update = this.update.bind(this);
	this._handleResize = this._handleResize.bind(this);
	this._handleElementClick = this._handleElementClick.bind(this);
	this._handleDocumentClick = this._handleDocumentClick.bind(this);
	this._handleKeyUp = this._handleKeyUp.bind(this);
	this._className = className;
	this._visible = false;
	this.x = this.y = 0;
	this.minMarginX = typeof this.minMarginX === 'number' ? this.minMarginX : 40;
	this.minMarginY = typeof this.minMarginY === 'number' ? this.minMarginY : 40;
	this._alignHorizontal = this._alignVertical = 'center';
	var el = this._element = document.createElement('div');
	el.style.position = 'fixed';
	this._transition = new TransitionAnimation(el, this.updatePosition.bind(this));
	this.update();
	document.body.appendChild(this._element);
}

var overlay = Overlay.prototype;

overlay._axis = [
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

overlay.destroy = function() {
	this.hide();
	document.body.removeChild(this._element);
	this._element = null;
};

overlay.contentElement = function() {
	return this._element;
};

overlay.show = function(evt) {
	evt.stopPropagation();

	if (this._visible === false) {
		this._visible = true;
		this._show();
	}

	this.resize();
	this.align.call(this, evt);
	this.update();
	return this;
};

overlay.hide = function() {
	if (this._visible === true) {
		this._visible = false;
		this._hide();
		this.update();
	}
	return this;
};

overlay._show = function() {
	this._transition.setTransitionClassName('cmsx-overlay-transition-show');
	this._element.addEventListener('click', this._handleElementClick);
	document.body.addEventListener('click', this._handleDocumentClick);
	document.body.addEventListener('keyup', this._handleKeyUp);
	window.addEventListener('resize', this._handleResize);
};

overlay._hide = function() {
	this._element.removeEventListener('click', this._handleElementClick);
	document.body.removeEventListener('click', this._handleDocumentClick);
	document.body.removeEventListener('keyup', this._handleKeyUp);
	window.removeEventListener('resize', this._handleResize);
};

overlay.update = function() {
	this._transition.setClassName(this._fullClassName());
	this._transition.update();
};

overlay.updatePosition = function() {
	this._element.style.left = this.x + 'px';
	this._element.style.top = this.y + 'px';
};

overlay._fullClassName = function() {
	return 'cmsx-overlay' +
		(this._className ? ' ' + this._className : '') +
		' cmsx-overlay-' + this._alignVertical + '-' + this._alignHorizontal +
		(this._visible ? ' cmsx-overlay-visible' : ' cmsx-overlay-hidden');
};

overlay.align = function(evt) {
	evt = evt || window.event;
	this.alignToElement(evt.target || evt.srcElement);
};

overlay.alignToElement = function(element) {
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

	this.x = this._setValidPosition(this._axis[0], window.innerWidth, vpX, vpX + elWidth, menuWidth);
	this.y = this._setValidPosition(this._axis[1], window.innerHeight, vpY, vpY + elHeight, menuHeight);
};

overlay.alignToMouse = function(evt) {
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

	this.x = this._setValidPosition(this._axis[0], window.innerWidth, mouseX, mouseX, menuWidth);
	this.y = this._setValidPosition(this._axis[1], window.innerHeight, mouseY, mouseY, menuHeight);
};

overlay.alignCenter = function() {
	this.x = window.innerWidth/2 - this._element.offsetWidth/2;
	this.y = window.innerHeight/2 - this._element.offsetHeight/2;
};

overlay._setValidPosition = function(axis, available, offsetLower, offsetHigher, required) {
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

	return Math.round(pos);
};

overlay._isValidAxisValue = function(available, offset, required) {
	return offset >= 0 && available >= required && offset + required <= available;
};

overlay.resize = function() {
	var maxWidth = window.innerWidth - this.minMarginX,
		maxHeight = window.innerHeight - this.minMarginY,
		width = this.prefWidth,
		height = this.prefHeight;

	if (this.resizeProportional && width > 0 && height > 0) {
		var resizeFactor = Math.min(maxWidth / width, maxHeight / height);

		if (resizeFactor < 1) {
			width = Math.floor(width * resizeFactor);
			height = Math.ceil(height * resizeFactor);
		}
	} else {
		if (width > maxWidth)
			width = Math.floor(width * (maxWidth / width));
		if (height > maxHeight)
			height = Math.floor(height * (maxHeight / height));
	}

	this.maxWidth = maxWidth;
	this.maxHeight = maxHeight;
	this.width = width;
	this.height = height;

	// Do resize directly since no animation required
	// and alignment calculation requires actual size
	var el = this._element;
	el.style.maxWidth = this.maxWidth + 'px';
	el.style.maxHeight = this.maxHeight + 'px';
	el.style.width = this.width ? this.width + 'px' : '';
	el.style.height = this.height ? this.height + 'px' : '';
};

overlay._handleResize = function(evt) {
	this.resize();
	this.update();
};

overlay._handleElementClick = function(evt) {
	this._elementClicked = true;
};

overlay._handleDocumentClick = function(evt) {
	if (this._elementClicked) {
		this._elementClicked = false;
	} else {
		this.hide();
	}
};

overlay._handleKeyUp = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
};

Overlay.show = function(evt) {
	if (!this._instance) {
		this._instance = new this(this.className);
	}

	return this._instance.show.apply(this._instance, arguments);
};

Overlay.destroy = function() {
	if (this._instance) {
		this._instance.destroy();
		delete this._instance;
	}
};

module.exports = Overlay;