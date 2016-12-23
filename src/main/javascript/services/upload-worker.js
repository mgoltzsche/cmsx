function UploadWorker(ctx) {
	this.ctx = ctx;
	this.processMessage = this.processMessage.bind(this);
	this.ctx.addEventListener('message', this.processMessage);
}

var upload = UploadWorker.prototype;

upload.processMessage = function(evt) {
	var data = evt.data;

	try {
		var contentType = typeof data.data === 'string' ? 'text/plain' : data.data.type;

		switch(data.type) {
			case 'upload':
				var xhr = new this.ctx.XMLHttpRequest();
				xhr.upload.onprogress = this.postProgress.bind(this, data.url);
				xhr.onerror = this.handleError.bind(this, data.url, xhr);
				xhr.onload = this.handleSuccess.bind(this, data.url, xhr);
				xhr.open(data.method, data.url, true);
				xhr.setRequestHeader('Content-Type', contentType);
				xhr.send(data.data);
				break;
			default:
				this.log('ERROR', 'Unsupported message type: ' + data.type + ". Expecting message: {type: '<type>', msg: <message>}");
		}
	} catch(e) {
		this.log('ERROR', 'Error in message processor: ' + data.type, e);
	}
};

upload.postProgress = function(url, evt) {
	this.ctx.postMessage({
		type: 'upload-progress',
		url: url,
		loaded: evt.loaded,
		total: evt.total
	});
};

upload.handleError = function(url, xhr) {
	this.ctx.postMessage({
		type: 'upload-failed',
		url: url,
		status: xhr.status
	});
};

upload.handleSuccess = function(url, xhr) {
	this.ctx.postMessage({
		type: 'upload-success',
		url: url
	});
};

upload.log = function(level, msg, err) {
	this.ctx.postMessage({
		type: 'log',
		level: level,
		msg: msg + (err ? ': ' + err + "\n" + (err.stack ? err.stack : '') : '')
	});
};

module.exports = function(self) {
	try {
		new UploadWorker(self);
	} catch(e) {
		upload.prototype.log.call({ctx: self}, 'ERROR', 'Worker internal initialization failed', e);
	}
};