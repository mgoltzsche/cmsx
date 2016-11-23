var utils = require('../cmsx-utils.js');
var DestroyablePool = require('../cmsx-destroyable-pool.js');

function ModalOverlay(onClick) {
	this._onClick = onClick;
	this._hidden = true;
	this._overlay = document.createElement('div');
	this._overlay.className = 'cmsx-modal-overlay cmsx-hidden';
	this._clickZone = document.createElement('div');
	this._clickZone.className = 'cmsx-modal-click-zone cmsx-hidden';
	this._clickZone.addEventListener('click', onClick);
	document.body.appendChild(this._overlay);
	document.body.appendChild(this._clickZone);
}

var overlay = ModalOverlay.prototype;

overlay.destroy = function() {
	this._clickZone.removeEventListener('click', this._onClick);
	this._clickZone.parentElement.removeChild(this._clickZone);
	this._overlay.parentElement.removeChild(this._overlay);
};

overlay.show = function() {
	if (this._hidden) {
		this._overlay.className = 'cmsx-modal-overlay cmsx-visible';
		this._clickZone.className = 'cmsx-modal-click-zone cmsx-visible';
		this._hidden = false;
	}
};

overlay.hide = function() {
	if (!this._hidden) {
		this._overlay.className = 'cmsx-modal-overlay cmsx-hidden';
		this._clickZone.className = 'cmsx-modal-click-zone cmsx-hidden';
		this._hidden = true;
	}
};

/**
 * Manages a modal overlay and active dialogs in a stack.
 */
function DialogStack() {
	this._dialogs = [];
	this._modalOverlay = null;
}

DialogStack.prototype.init = function() {
	if (this._modalOverlay === null) {
		this._modalOverlay = new ModalOverlay(this._handleModalOverlayClick.bind(this));
	}
};

DialogStack.prototype.pushDialog = function(dialog) {
	if (this._dialogs.length > 0) { // hide last dialog
		this._dialogs[this._dialogs.length - 1].setActive(false);
	}

	this._modalOverlay.show();
	this._dialogs.push(dialog);
	this._updateZIndex();
};

DialogStack.prototype.popDialog = function(dialog) {
	this._dialogs.pop();

	if (this._dialogs.length > 0) { // show last dialog
		this._dialogs[this._dialogs.length - 1].setActive(true);
		this._updateZIndex();
	} else {
		this._modalOverlay.hide();
	}
};

DialogStack.prototype._handleModalOverlayClick = function() {
	if (this._dialogs.length > 0) {
		this._dialogs[this._dialogs.length - 1].hide();
	} else {
		this._modalOverlay.hide(); // in case of bug
	}
};

DialogStack.prototype._updateZIndex = function() {
	var zIndex = 990;
	for (var i = this._dialogs.length - 1; i >= 0; i--) {
		this._dialogs[i]._elements.container.style.zIndex = zIndex;
		zIndex -= 5;
	}
};

var dialogStack = new DialogStack();


function CmsxDialog(dialogStack, contentView, prefs) {
	utils.bindAll(this);
	this.init(dialogStack, contentView, prefs);
}

var dialog = CmsxDialog.prototype;

dialog.init = function(dialogStack, prefs) {
	prefs = prefs || {};

	this._className = prefs.className;
	this._resizeProportional = !!prefs._resizeProportional;
	this._prefWidth = prefs.preferredWidth || 0;
	this._prefHeight = prefs.preferredHeight || 0;
	this._minMarginX = typeof prefs.minMarginX == 'number' ? prefs.minMarginX : 10;
	this._minMarginY = typeof prefs.minMarginY == 'number' ? prefs.minMarginY : 10;
	this._dialogStack = dialogStack;
	this._visible = false;
	this._active = false;

	// Create and mount DOM elements
	var els = this._elements = {
		container: document.createElement('div'),
		close: document.createElement('a'),
		content: document.createElement('div')
	};

	this._updateClassName();
	els.content.className = 'cmsx-dialog-content';
	els.close.className = 'cmsx-dialog-close';
	els.close.addEventListener('click', this._handleClose);
	els.container.appendChild(els.close);
	els.container.appendChild(els.content);
	document.body.appendChild(els.container);

	this._deriveOffset();
	this._deriveMaxContentSize();	
};

dialog.destroy = function() {
	if (!this._elements) return;
	this.hide();
	document.body.removeChild(this._elements.container);
	this._elements.close.removeEventListener('click', this._handleClose);
	delete this._elements;
};

dialog.contentElement = function() {
	return this._elements.content;
};

dialog.show = function() {
	if (!this._visible) {
		this._visible = true;
		this._doShow();
	}

	return this;
};

dialog.hide = function() {
	if (this._visible) {
		// Set state before listener invocation to guarantee method is not executed reentrant
		this._visible = false;
		this._doHide();
	}

	return this;
};

dialog._doShow = function() {
	this._dialogStack.pushDialog(this);
	this.resize();
	document.body.addEventListener('keyup', this._handleEscapeKey);
	window.addEventListener('resize', this.resize);
	this.setActive(true);
};

dialog._doHide = function() {
	this._dialogStack.popDialog();
	document.body.removeEventListener('keyup', this._handleEscapeKey);
	window.removeEventListener('resize', this.resize);
	this.setActive(false);
};

dialog.setActive = function(active) {
	this._active = active;
	this._updateClassName();
};

dialog.getMaxContentWidth = function() {
	return this._maxContentWidth;
};

dialog.getMaxContentHeight = function() {
	return this._maxContentHeight;
};

dialog.setPreferredContentSize = function(width, height, resizeProportional) {
	var proportionalDefined = typeof resizeProportional !== 'undefined';

	if (this._prefWidth !== width || this._prefHeight !== height ||
			proportionalDefined && this._resizeProportional !== resizeProportional) {
		this._prefWidth = width || 0;
		this._prefHeight = height || 0;

		if (proportionalDefined) {
			this._resizeProportional = resizeProportional;
		}

		this.resize();
	}
};

dialog.resize = function() {
//	log.debug('Resize to ' + this._prefWidth + 'x' + this._prefHeight);
	this._deriveMaxContentSize();
	var contentStyle = this._elements.content.style,
		maxWidth = this._maxContentWidth,
		maxHeight = this._maxContentHeight,
		width = this._prefWidth,
		height = this._prefHeight,
		proportional = this._resizeProportional,
		bothAxisDefined = width > 0 && height > 0;

	if (bothAxisDefined && proportional) {
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

	contentStyle.width = width > 0 ? width + 'px' : 'auto';
	contentStyle.height = height > 0 ? height + 'px' : 'auto';
	contentStyle.maxWidth = maxWidth + 'px';
	contentStyle.maxHeight = maxHeight + 'px';
	contentStyle.overflow = proportional ? 'hidden' : 'auto';
};

/**
 * Detects outer size of dialog as offset x/y.
 * ATTENTION: Requires CSS to be loaded.
 */
dialog._deriveOffset = function() {
	var dialog = this._elements.container,
		content = this._elements.content,
		testWidth = window.innerWidth - this._minMarginX * 2;
	content.style.visibility = 'hidden';
	content.style.overflow = 'hidden';
	content.style.display = 'block';
	dialog.style.display = 'block';
	dialog.style.position = 'fixed';
	dialog.style.left = '-' + testWidth + 'px';
	var testSize = testWidth + 'px';
	content.style.width = testSize;
	content.style.height = testSize;
	content.style.minWidth = testSize;
	content.style.minHeight = testSize;
	content.style.maxWidth = testSize;
	content.style.maxHeight = testSize;
	this._offsetX = dialog.offsetWidth - testWidth; // Detect offset x
	this._offsetY = dialog.offsetHeight - testWidth; // Detect offset y
//	log.debug('Detected offset: x: ' + this._offsetX + ', y: ' + this._offsetY);
	content.removeAttribute('style'); // Remove all inline styles used to detect offset
	dialog.removeAttribute('style');
	if (this._offsetX < 0) this._offsetX = 0; // Fallback on error
	if (this._offsetY < 0) this._offsetY = 0; // Fallback on error
};

dialog._deriveMaxContentSize = function() {
	this._maxContentWidth = window.innerWidth - this._offsetX - this._minMarginX * 2;
	this._maxContentHeight = window.innerHeight - this._offsetY - this._minMarginY * 2;
};

dialog._updateClassName = function() {
	var className = 'cmsx-dialog';

	if (typeof this._className === 'string') {
		className += ' ' + this._className;
	}

	className += (this._visible ? ' cmsx-dialog-visible' : ' cmsx-dialog-hidden');
	className += (this._active ? ' cmsx-dialog-active' : ' cmsx-dialog-inactive');
	this._elements.container.className = className;
};

dialog._handleClose = function(evt) {
	evt.preventDefault();
	this.hide();
};

dialog._handleEscapeKey = function(evt) {
	if (evt.keyCode === 27) {
		this.hide();
	}
};


function CmsxPooledDialog(dialogStack, pool, prefs) {
	utils.bindAll(this);
	this._pool = pool;
	this.init(dialogStack, prefs);
}

var pooled = utils.extend(CmsxPooledDialog.prototype, dialog);

pooled.destroy = function() {
	dialog.destroy.call(this);
	this.content.destroy();
};

pooled._doHide = function() {
	dialog._doHide.call(this);
	this._pool.release(this);
};

var createDialogPool = function createDialogPool(dialogStack, props, contentFactory, size) {
	return new DestroyablePool(function(pool) {
		dialogStack.init();
		var dialog = new CmsxPooledDialog(dialogStack, pool, props),
			content = contentFactory(dialog);
		dialog.content = content;
		content.mount(dialog.contentElement());
		return dialog;
	}, size || 1, 1);
}.bind(undefined, dialogStack);


var createDialog = (function(dialogStack) {
	return function createDialog(props) {
		dialogStack.init();
		return new this(dialogStack, props);
	};
})(dialogStack);


CmsxDialog.create = createDialog;
CmsxDialog.createPool = createDialogPool;
CmsxDialog.Pooled = CmsxPooledDialog;
module.exports = CmsxDialog;