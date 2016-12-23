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

transition.setTransition = function(transition) {
	this._transition = transition;
};

transition.update = function() {
	var animation = this._transition ? ' cmsx-transition ' + this._transition : ' cmsx-animate';
	this._element.className = this._className + animation;
	this.onUpdate(this._element, this._transition);

	if (transition) {
		this._transition = null;
		window.setTimeout(this.update);
	}
};

transition.onUpdate = function(element, transition) {};

module.exports = CmsxTransitionAnimation;