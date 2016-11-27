function CmsxTransitionAnimation(element, onUpdate) {
	this._element = element;
	this.update = this.update.bind(this);

	if (onUpdate) {
		this.onUpdate = onUpdate;
	}
}

var transition = CmsxTransitionAnimation.prototype;

transition.setClassName = function(className) {
	this._className = className;
};

transition.setTransitionClassName = function(transitionClassName) {
	this._transitionClassName = transitionClassName;
};

transition.update = function() {
	var transition = this._transitionClassName;
	this._element.className = this._className + ' ' + (transition ? transition : 'cmsx-animate');
	this.onUpdate(this._element, this._transitionClassName);

	if (transition) {
		this._transitionClassName = null;
		window.setTimeout(this.update);
	}
};

transition.onUpdate = function(element) {};

module.exports = CmsxTransitionAnimation;