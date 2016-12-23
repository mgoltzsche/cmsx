function CmsxToolbarContent(label, contentElement, onClick, styleClass) {
	this._label = label;
	this._contentElement = contentElement;
	this._button = document.createElement('a');
	this._button.className = 'cmsx-toolbar-button' + (styleClass ? ' ' + styleClass : '');
	this._button.href = '#';
	this._button.innerHTML = this._label;

	if (onClick) {
		this.onClick = onClick;
	}
}

CmsxToolbarContent.prototype.onClick = function(evt, element, toolbar) {
};

CmsxToolbarContent.prototype.getButton = function() {
	return this._button;
};

CmsxToolbarContent.prototype.getContent = function() {
	return this._contentElement;
};

function CmsxToolbar(buttons) {
	this._showButtons = false;
	this._showContent = false;
	this._element = document.createElement('div');
	this._buttonsElement = document.createElement('div');
	this._contentsElement = document.createElement('div');
	this._element.className = 'cmsx-site-toolbar';
	this._buttonsElement.className = 'cmsx-site-toolbar-buttons';
	this._contentsElement.className = 'cmsx-site-toolbar-contents';
	var btnHandler = function(button, evt) {
		button.onClick(evt);

		var content = button.getContent();
		var buttonElement = button.getButton();

		if (content) {
			if (this._lastContent) {
				this._lastContent.getButton().classList.remove('cmsx-toolbar-button-active');
				this._lastContent.getContent().classList.remove('cmsx-toolbar-content-active');
			}

			content.classList.add('cmsx-toolbar-content-active');
			buttonElement.classList.add('cmsx-toolbar-button-active');

			this._lastContent = button;
			this._showContent = true;
			this.update();
		}
	};
	var toggleButton = new CmsxToolbarContent('toggle', null, function() {
		this._showButtons = !this._showButtons;
		this._showContent = false;

		if (this._lastContent) {
			this._lastContent.getButton().classList.remove('cmsx-toolbar-button-active');
			this._lastContent.getContent().classList.remove('cmsx-toolbar-content-active');
			this._lastContent = null;
		}

		this.update();
	}.bind(this), 'cmsx-toolbar-button-visible');
	buttons = [toggleButton].concat(buttons);

	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		var buttonElement = button.getButton();
		var contentElement = button.getContent();
		buttonElement.onclick = btnHandler.bind(this, button);
		this._buttonsElement.appendChild(buttonElement);
		if (contentElement) {
			contentElement.classList.add('cmsx-toolbar-content');
			this._contentsElement.appendChild(contentElement);
		}
	}

	this._element.appendChild(this._buttonsElement);
	this._element.appendChild(this._contentsElement);
	this.update();
	document.getElementsByTagName('body')[0].appendChild(this._element);
}

var Toolbar = CmsxToolbar.prototype;

Toolbar.showProgress = function(value) {
	this._showProgress = value;
	this.update();
};

Toolbar.update = function() {
	this._element.className = 'cmsx-site-toolbar ' +
		(this._showContent ? ' cmsx-toolbar-show-content' : '') +
		(this._showButtons ? ' cmsx-toolbar-show-buttons' : '');
};

module.exports.CmsxToolbar = CmsxToolbar;
module.exports.CmsxToolbarContent = CmsxToolbarContent;