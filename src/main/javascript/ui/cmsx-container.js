function CmsxContainer(elementName, className) {
	this._element = document.createElement(elementName || 'div');
	if (className) this._element.className = className;
	this._components = [];
}

var container = CmsxContainer.prototype;

container.element = function() {
	return this._element;
};

container.destroy = function() {
	this._element.parentElement.removeChild(this._element);
	for (var i = 0; i < this._components.length; i++) {
		this._components[i].destroy();
	}
	delete this._element;
	delete this._components;
};

container.add = function(component) {
	this.contentElement().appendChild(component.element());
	this._components.push(component);
	component.parentComponent = this;
	return this;
};

container.contentElement = function() {
	return this._element;
};

module.exports = CmsxContainer;