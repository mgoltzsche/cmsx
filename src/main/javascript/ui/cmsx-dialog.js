var Overlay = require('./cmsx-overlay.js');

function ModalBackground(onClick) {
	this._hidden = true;
	this._onClick = onClick;
	this._overlay = document.createElement('div');
	this._clickZone = document.createElement('div');
	this._overlay.className = 'cmsx-modal-background cmsx-hidden';
	this._clickZone.className = 'cmsx-modal-click-zone cmsx-hidden';
	this._clickZone.addEventListener('click', onClick);
	document.body.appendChild(this._overlay);
	document.body.appendChild(this._clickZone);
}

var modalBackground = ModalBackground.prototype;

modalBackground.destroy = function() {
	this._overlay.parentElement.removeChild(this._overlay);
	this._clickZone.parentElement.removeChild(this._clickZone);
	this._clickZone.removeEventListener('click', this._onClick);
	delete this._overlay;
	delete this._clickZone;
};

modalBackground.show = function() {
	if (this._hidden) {
		this._overlay.className = 'cmsx-modal-background cmsx-visible';
		this._clickZone.className = 'cmsx-modal-click-zone cmsx-visible';
		this._hidden = false;
	}
};

modalBackground.hide = function() {
	if (!this._hidden) {
		this._overlay.className = 'cmsx-modal-background cmsx-hidden';
		this._clickZone.className = 'cmsx-modal-click-zone cmsx-hidden';
		this._hidden = true;
	}
};

/**
 * A modal dialog
 * @param className additional dialog class name
 */
function CmsxDialog(className) {
	this._dialogRegistry.dialogCreated();
	this._active = false;
	Overlay.call(this, 'cmsx-dialog' + (className ? ' ' + className : ''));
}

var base = Overlay.prototype,
	dialog = CmsxDialog.prototype = Object.create(base);

/**
 * Tracks dialog lifecycle and manages a modal overlay as well as visible dialogs in a stack.
 */
dialog._dialogRegistry = {
	current: null,
	active: [],
	dialogCount: 0,
	dialogCreated: function() {
		if (this.dialogCount++ === 0) {
			this.modalBackground = new ModalBackground(this.handleModalClick.bind(this));
		}
	},
	dialogDestroyed: function() {
		if (--this.dialogCount === 0) {
			this.modalBackground.destroy();
		}
	},
	pushActiveDialog: function(dialog) {
		if (this.active.length > 0) { // set last dialog inactive
			this.active[this.active.length - 1].setActive(false);
		} else {
			this.modalBackground.show();
		}

		this.current = dialog;
		this.active.push(dialog);
	},
	popActiveDialog: function(evt) {
		var dialog = this.active.pop();

		if (this.active.length > 0) { // set last dialog active
			this.current = this.active[this.active.length - 1];
			this.current.setActive(true);
		} else {
			this.current = null;
			this.modalBackground.hide();
		}

		dialog.hide(evt);
	},
	handleModalClick: function(evt) {
		this.active[this.active.length - 1].hide(evt);
	}
};

dialog.prefSize = function(prefWidth, prefHeight) {
	this.prefWidth = prefWidth;
	this.prefHeight = prefHeight;
	return this;
};

dialog.show = function(evt) {
	base.show.call(this, evt);
	this.alignCenter();
	this.update();
	return this;
};

dialog.destroy = function() {
	base.destroy.call(this);
	this._dialogRegistry.dialogDestroyed();
};

dialog._show = function() {
	base._show.call(this);
	this._dialogRegistry.pushActiveDialog(this);
	this._active = true;
};

dialog._hide = function() {
	base._hide.call(this);
	this._dialogRegistry.popActiveDialog(this);
	this._active = false;
};

dialog._fullClassName = function() {
	return base._fullClassName.call(this) +
		(this._active ? ' cmsx-dialog-active' : ' cmsx-dialog-inactive');
};

dialog.align = function(evt) {
	if (evt) {
		evt = evt || window.event;
		this.x = evt.clientX;
		this.y = evt.clientY;
	} else {
		this.x = window.offsetWidth / 2;
		this.y = window.offsetHeight / 2;
	}
};

dialog.setActive = function(active) {
	this._active = active;
	this.update();
};

dialog._handleResize = function() {
	this._transition.setTransition('cmsx-dialog-transition-resize');
	this.resize();
	this.alignCenter();
	this.update();
};

dialog._handleDocumentClick = function(evt) {};

dialog._handleKeyUp = function(evt) {
	if (this._active) {
		base._handleKeyUp.call(this, evt);
	}
};

CmsxDialog.show = Overlay.show;
CmsxDialog.destroy = Overlay.destroy;
module.exports = CmsxDialog;