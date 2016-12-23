function LocalMediator(mediator, prefix) {
	this._mediator = mediator;
	this._prefix = prefix + '.';
	this._subscribers = [];
}

var localMediator = LocalMediator.prototype;

localMediator.event = function(localChannelName, callback) {
	var channel = this._prefix + localChannelName;
	this[localChannelName] = this._mediator.publish.bind(this._mediator, channel);
	if (callback) {
		this.subscribe(channel, callback);
	}
	return this;
};

localMediator.subscribe = function(channel, callback) {
	this._subscribers.push({channel: channel, callback: callback});
	this._mediator.subscribe(channel, callback);
	return this;
};

localMediator.destroy = function() {
	for (var i = 0; i < this._subscribers.length; i++) {
		var subscriber = this._subscribers[i];
		this._mediator.unsubscribe(subscriber.channel, subscriber.callback);
	}
	delete this._subscribers;
	delete this._mediator;
};


function Mediator() {
	this._channels = {};
}

var mediator = Mediator.prototype;

mediator.subscribe = function(channel, callback) {
	if (typeof callback !== 'function') throw 'Provided mediator callback for channel ' + channel + ' is not a function';
	var listeners = this._channels[channel] = this._channels[channel] || [];
	listeners.push(callback);
};

mediator.unsubscribe = function(channel, callback) {
	var listeners = this._channels[channel];
	if (listeners) {
		listeners = listeners.filter(function(listener) {return listener !== callback;});
		if (listeners.length === 0) {
			delete this._channels[channel];
		}
	}
};

mediator.publish = function(channel, data) {
	var i, listeners = this._channels[channel], args = Array.prototype.slice.call(arguments, 1);
	if (listeners) {
		for (i = 0; i < listeners.length; i++) {
			listeners[i].apply(undefined, args);
		}
	}
};

mediator.newLocalInstance = function(prefix) {
	return new LocalMediator(this, prefix);
};

/*mediator.declareEvents = function(prefix, eventNames) {
	var i, events = {}, createGetter = function(eventName) {
		return function() {
			return prefix + '.' + eventName;
		};
	};
	for (i = 1; i < arguments.length; i++) {
		eventName = arguments[i];
		events[eventName] = createGetter(eventName);
	}
	return events;
};*/

mediator.destroy = function() {
	delete this._channels;
};

module.exports = new Mediator();