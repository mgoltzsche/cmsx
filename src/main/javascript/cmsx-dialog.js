var log = require('./logger.js')('Dialog');
var React = require('react');
var ReactDOM = require('react-dom');

var filter = function(items, rmItem) {
	var filtered = [];
	for (var i = 0; i < items.length; i++) {
		if (items[i] !== rmItem) {
			filtered.push(items);
		}
	}
	return filtered;
};

function ModalOverlay(onClick) {
	this._onClick = onClick;
	this._hidden = true;
	var modalElement = document.createElement('div');
	modalElement.className = 'dialog-modal-overlay hidden';
	modalElement.addEventListener('click', this.onClick.bind(this));
	document.body.appendChild(modalElement);
	this._element = modalElement;
}

var overlay = ModalOverlay.prototype;

overlay.onClick = function(e) {
	e.stopPropagation();
	this._onClick();
};

overlay.show = function() {
	if (this._hidden) {
		this._element.className = 'dialog-modal-overlay';
		this._hidden = false;
	}
};

overlay.hide = function() {
	if (!this._hidden) {
		this._element.className = 'dialog-modal-overlay hidden';
		this._hidden = true;
	}
};

/**
 * Manages a modal overlay and active dialogs in a stack.
 */
function DialogManager() {
	this._dialogs = [];
	this._modalOverlay = null;
}

var manager = DialogManager.prototype;

manager.init = function() {
	if (this._modalOverlay === null) {
		this._modalOverlay = new ModalOverlay(this.onModalOverlayClick.bind(this));
	}
};

manager.onModalOverlayClick = function() {
	if (this._dialogs.length > 0) {
		this._dialogs[this._dialogs.length - 1].hide();
	}
	this._modalOverlay.hide();
};

manager.pushDialog = function(dialog) {
	if (this._dialogs.length > 0) { // hide last dialog
		this._dialogs[this._dialogs.length - 1].hide();
	}

	this._dialogs.push(dialog);
	this._modalOverlay.show();
};

manager.popDialog = function() {
	this._dialogs.pop();

	if (this._dialogs.length > 0) { // show last dialog
		this._dialogs[this._dialogs.length - 1].show();
	}

	if (this._dialogs.length === 0) {
		this._modalOverlay.hide();
	}
};

var dialogManager = new DialogManager();

var Dialog = React.createClass({
	getDefaultProps: function() {
		return {
			show: false,
			header: null,
			footer: null,
			resizeProportional: false,
			prefWidth: 0,
			prefHeight: 0,
			marginX: 20,
			marginY: 20,
			onResize: function() {},
			onClose: function() {}
		};
	},
	componentDidMount: function() {
		dialogManager.init();

		// Detect outer size of dialog as offset x/y
		// ATTENTION: Requires CSS to be loaded before this javascript
		var dialog = this.refs.dialog;
		var content = this.refs.content;
		content.style.visibility = 'hidden';
		content.style.overflow = 'hidden';
		content.style.display = 'block';
		dialog.style.display = 'block';
		dialog.style.position = 'fixed';
		dialog.style.left = '-2000px';
		dialog.style.top = '-2000px';
		var testSize = '1000px';
		content.style.width = testSize;
		content.style.height = testSize;
		content.style.minWidth = testSize;
		content.style.minHeight = testSize;
		content.style.maxWidth = testSize;
		content.style.maxHeight = testSize;
		this._offsetX = dialog.offsetWidth - 1000; // Detect offset x
		this._offsetY = dialog.offsetHeight - 1000; // Detect offset y
		log.debug('Detected offset: x: ' + this._offsetX + ', y: ' + this._offsetY);
		content.removeAttribute('style'); // Remove all inline styles used to detect offset
		dialog.removeAttribute('style');

		if (this._offsetX < 0) this._offsetX = 0; // Fallback on error
		if (this._offsetY < 0) this._offsetY = 0; // Fallback on error

		this._prefWidth = this.props.prefWidth;
		this._prefHeight = this.props.prefHeight;
		this._resizeProportional = this.props.resizeProportional;
		this.resize();

		document.body.addEventListener('keyup', this.handleEscapeKey);
		window.addEventListener('resize', this.handleResize);

		if (this.props.show) {
			this._show = false;
			this.show();
		} else {
			this._show = false;
			this.updateClassName();
		}
	},
	componentWillUnmount: function() {
		document.body.removeEventListener('keyup', this.handleEscapeKey);
		window.removeEventListener('resize', this.handleResize);
	},
	componentWillUpdate: function(nextProps, nextState) {
		// Resize dialog if props changed
		if (nextProps.prefWidth !== this.props.prefWidth ||
				nextProps.prefHeight !== this.props.prefHeight ||
				nextProps.resizeProportional !== this.props.resizeProportional) {
			this._prefWidth = nextProps.prefWidth;
			this._prefHeight = nextProps.prefHeight;
			this._resizeProportional = nextProps.resizeProportional;
			this.resize();
		}

		// Open/close dialog if props changed
		if (nextProps.show !== this.props.show) {
			(nextProps.show ? this.show : this.hide)();
		}
	},
	handleResize: function(e) {
		if (this._show)
			this.resize();
	},
	handleEscapeKey: function(e) {
		if (this._show && e.keyCode === 27) {
			this.handleClose(e);
		}
	},
	handleClose: function(e) {
		e.preventDefault();
		this.hide();
	},
	toggle: function() {
		(this._show ? this.hide : this.show)();
	},
	show: function() {
		if (!this._show) {
			dialogManager.pushDialog(this);
			this._show = true;
			this.resize();
			this.updateClassName();
			return true;
		}

		return false;
	},
	hide: function() {
		if (this._show) {
			// Set state before listener invocation to guarantee method is not executed reentrant
			this._show = false;

			dialogManager.popDialog();

			try {
				this.props.onClose();
			} catch(e) {
				log.error('Error in dialog close listener', e);
			}

			this.updateClassName();
			return true;
		}

		return false;
	},
	/* Method to set preferred size manually without rerendering everything */
	setPreferredContentSize: function(width, height, resizeProportional) {
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
	},
	resize: function() {
		log.debug('Resize to ' + this._prefWidth + 'x' + this._prefHeight);
		var contentStyle = this.refs.content.style;
		var vpWidth = window.innerWidth;
		var vpHeight = window.innerHeight;
		var maxWidth = vpWidth - this._offsetX - this.props.marginX * 2;
		var maxHeight = vpHeight - this._offsetY - this.props.marginY * 2;
		var width = this._prefWidth;
		var height = this._prefHeight;
		var proportional = this._resizeProportional;
		var bothAxisDefined = width > 0 && height > 0;

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

		contentStyle.maxWidth = maxWidth + 'px';
		contentStyle.maxHeight = maxHeight + 'px';
		contentStyle.overflow = proportional ? 'hidden' : 'auto';

		if (bothAxisDefined) {
			contentStyle.width = width + 'px';
			contentStyle.height = height + 'px';
		} else {
			contentStyle.width = width > 0 ? width + 'px' : 'auto';
			contentStyle.height = height > 0 ? height + 'px' : 'auto';
		}

		//var dialog = this.refs.dialog;
		//var left = Math.floor(vpWidth / 2 - dialog.offsetWidth / 2);
		//var top = Math.floor(vpHeight / 2 - dialog.offsetHeight / 2);
		//dialog.style.left = left + 'px';
		//dialog.style.top = top + 'px';

		this._maxContentWidth = maxWidth;
		this._maxContentHeight = maxHeight;
		this.props.onResize(maxWidth, maxHeight);
	},
	getMaxContentWidth: function() {
		return this._maxContentWidth;
	},
	getMaxContentHeight: function() {
		return this._maxContentHeight;
	},
	getClassName: function() {
		var className = 'dialog';

		if (typeof this.props.className === 'string') {
			className += ' ' + this.props.className;
		}

		return className + (this._show ? ' open' : ' hidden');
	},
	updateClassName: function() {
		this.refs.dialog.className = this.getClassName();
	},
	render: function() {
		var closeButton = React.DOM.div({
			className: 'dialog-close',
			onClick: this.handleClose
		});
		var header = React.DOM.div({
			ref: 'header',
			className: 'dialog-header'
		}, this.props.header, closeButton);
		var content = React.DOM.div({
			ref: 'content',
			className: 'dialog-content'
		}, this.props.children);
		var footer = React.DOM.div({
			ref: 'footer',
			className: 'dialog-footer'
		}, this.props.footer);
		return React.DOM.div({
			ref: 'dialog',
			className: this.getClassName()
		}, header, content, footer);
	}
});

module.exports = Dialog;