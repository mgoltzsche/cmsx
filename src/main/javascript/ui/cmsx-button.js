function CmsxButton(label, onClick) {
	this._onClick = onClick;
	this._element = document.createElement('a');
	this._element.className = 'cmsx-button';
	this._element.textContent = label;
	this._handleButtonClick = this._handleButtonClick.bind(this);
	this._element.addEventListener('click', this._handleButtonClick);
}

var button = CmsxButton.prototype;

button.element = function() {
	return this._element;
};

button.destroy = function() {
	this._element.parentElement.removeChild(this._element);
	this._element.removeEventListener('click', this._handleButtonClick);
};

button._handleButtonClick = function(evt) {
	evt.preventDefault();
	this._onClick(evt);
};

module.exports = CmsxButton;