function CmsxDestroyablePool(factory, size, deferredDestroyMs) {
	this._size = size;
	this._deferredDestroyMs = deferredDestroyMs;
	this._factory = factory;
	this._reserved = [];
	this._released = [];
}

var pool = CmsxDestroyablePool.prototype;

pool.get = function() {
	var reserved;

	if (this._released.length === 0) {
		reserved = this._factory(this);
		this._reserved.push(reserved);
	} else {
		reserved = this._released.pop();
		this._reserved.push(reserved);
	}

	return reserved;
};

pool.release = function(obj) {
	this._reserved = this._reserved.filter(function(o) {return obj !== o;});

	if (this._released.length < this._size) {
		this._released.push(obj);
	} else if (this._deferredDestroyMs) { 
		window.setTimeout(obj.destroy.bind(obj), this._deferredDestroyMs);
	} else {
		obj.destroy();
	}
};

pool.destroy = function() {
	this._released.forEach(this._destroyItem);
	this._reserved.forEach(this._destroyItem);
	delete this._factory;
	delete this._reserved;
	delete this._released;
};

pool._destroyItem = function(obj) {
	obj.destroy();
};

module.exports = CmsxDestroyablePool;