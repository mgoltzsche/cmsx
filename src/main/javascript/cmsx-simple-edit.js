/**
 * Simple text editor.
 * @param elements selector or element list to handle as input fields.
 * @param onChange change callback as function(event, editable)
 * @returns
 */
function SimpleEdit(elements, onChanged) {
	elements = typeof elements == 'string' ? document.querySelectorAll(elements) : elements;
	this._instances = [];

	var createHandler = function(self, instance) {
		return function(evt) {
			self.handleInput(instance, evt);
		};
	};

	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		var instance = {
			element: el
		};
		instance.onChanged = createHandler(this, instance);

		this._instances.push(instance);
		instance.element.setAttribute('contenteditable', true);
		el.addEventListener('input', instance.onChanged);
	}
}

var se = SimpleEdit.prototype;

se._htmlPattern = '/<[^>]+>/g';
se.handleInput = function(instance, evt) {
	evt = evt || window.event;
	var el = evt.target || evt.srcElement;

	if (el.innerHTML.indexOf('<') != -1) {
		el.innerHTML = el.textContent; // recursion
	} else {
		instance.onChanged(evt, el);
	}
};

se.destroy = function() {
	for (var i = 0; i < this._instances.length; i++) {
		var instance = this._instances[i];

		instance.element.removeEventListener('input', instance.onChanged);
		instance.element.removeAttribute('contenteditable');
	}

	delete this._instances;
};


module.exports = SimpleEdit;