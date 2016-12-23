var createLogger = require('../logger.js');
var log = createLogger('WebDavClient');
var $ = require('jquery');
var ABSOLUTE_URL_PATTERN = /^[^:\/]+:\/\/.+/;
var resolveUrl = function(url) {
	var baseUrl = window.location.href;
	var hashPos = baseUrl.indexOf('#');
	if (hashPos !== -1) baseUrl = baseUrl.substring(0, hashPos);

	if (url.match(ABSOLUTE_URL_PATTERN)) { // absolute URL with protocol + host
		return url;
	} else if (url.substring(0, 1) === '/') { // server relative URL
		return baseUrl.substring(0, baseUrl.indexOf('/', baseUrl.indexOf('//') + 2)) + url;
	} else { // relative URL
		return baseUrl.substring(0, baseUrl.lastIndexOf('/')) + '/' + url;
	}
};

function WebDavClient(rootURL, user, password) {
	this._rootURL = rootURL;
	this._defaultErrorHandler = function(xhr) {alert('WebDAV request failed with HTTP status code ' + xhr.status + '!');};
	this._uploadWorker = null;
	this._uploadQueue = [];
	this._pendingUploads = {};
	this._pendingUploadCount = 0;
	this._request = function(method, path, req) {
		req.method = method;
		req.url = path;
		req.processData = false;

		if (user && password) {
			req.headers = req.headers || {};
			req.headers.Authorization = 'Basic ' + btoa(user + ':' + password);
		}

		if (req.success) {
			req.success = function(data, statusStr, jqXHR) {
				this(jqXHR);
			}.bind(req.success);
		}

		if (!req.error) {
			req.error = function(jqXhr, textStatus, error) {
				log.debug('Request ' + method + ' ' + req.url + ' failed: ' + textStatus + ' ' + error);
			};
		}

		if (req.uploadProgress) {
			req.xhr = function() {
				var xhr = new window.XMLHttpRequest();
				xhr.upload.addEventListener('progress', this, false);
				return xhr;
			}.bind(req.uploadProgress);
			delete req.uploadProgress;
		}

		return $.ajax(req);
	};
	log.debug('Upload worker supported: ' + UploadWorkerManager.isSupported());
}

var webdav = WebDavClient.prototype;

webdav.davPropfind = function(path, depth, callback, errorCallback) {
	this._request('PROPFIND', this._rootURL + path, {
		success: function(callback, xhr) {
			callback(this._parsePropfindResult(xhr));
		}.bind(this, callback),
		error: errorCallback,
		headers: {
			'Depth': depth || 0,
			'Content-Type': 'text/xml; charset=UTF-8'
		},
		data: '<?xml version="1.0" encoding="UTF-8" ?><D:propfind xmlns:D="DAV:"><D:allprop /></D:propfind>'
	});
};

webdav.davMkcol = function(path, callback, errorCallback) {
	this._request('MKCOL', this._rootURL + path, {
		success: callback.bind(undefined, path),
		error: errorCallback
	});
};

webdav.davGet = function(path, callback, errorCallback) {
	this._request('GET', this._rootURL + path, {
		success: callback,
		error: errorCallback
	});
};

webdav.davDelete = function(path, callback, errorCallback) {
	this._request('DELETE', this._rootURL + path, {
		success: callback.bind(undefined, path),
		error: errorCallback
	});
};

webdav.davMove = function(path, destination, callback, errorCallback) {
	// See http://www.webdav.org/specs/rfc2518.html#rfc.section.8.9.2
	// Required to move collection but fails with Bad request on collection move if locking supported.
	// Lock on source and destination has to be acquired first.
	//.setRequestHeader('Depth', 'Infinity')

	this._request('MOVE', this._rootURL + path, {
		success: callback.bind(undefined, path, destination),
		error: errorCallback,
		headers: {
			'Destination': this._rootURL + destination
		}
	});
};

webdav.davPut = function(path, data, callback, errorCallback, progressCallback) {
	var uploadInfo = {
		url: resolveUrl(this._rootURL + path),
		data: data,
		onSuccess: callback.bind(undefined, path),
		onError: errorCallback,
		onProgress: progressCallback
	};

	if (this._pendingUploads[uploadInfo.url])
		return false;

	this._pendingUploads[uploadInfo.url] = uploadInfo;

	if (this._pendingUploadCount++ === 0) { // first upload. start immediately
		this._upload(uploadInfo);
	} else { // Nth upload. queue and start later
		this._uploadQueue.push(uploadInfo);
	}

	return true;
};

webdav._upload = function(upload) {
	if (UploadWorkerManager.isSupported()) {
		this._putWithWorker(upload);
	} else {
		this._putFallback(upload);
	}
};

webdav._onUploadFinished = function(upload) {
	delete this._pendingUploads[upload.url];

	if (--this._pendingUploadCount === 0 && this._uploadWorker !== null) { // Last upload. Stop worker
		this._uploadWorker.destroy();
		delete this._uploadWorker;
	} else if (this._uploadQueue.length > 0) { // Start next queued upload
		this._upload(this._uploadQueue.pop());
	}
};

webdav._onUploadSuccess = function(upload, xhr) {
	try {
		upload.onSuccess(xhr);
	} catch(e) {
		log.error('Upload success callback failed', e);
	}

	this._onUploadFinished(upload);
};

webdav._onUploadError = function(upload, xhr) {
	try {
		upload.onError(xhr.status);
	} catch(e) {
		log.error('Upload error callback failed', e);
	}

	this._onUploadFinished(upload);
};

webdav._onUploadProgress = function(upload, loaded, total) {
	try {
		upload.onProgress(loaded, total);
	} catch(e) {
		log.error('Upload progress callback failed', e);
	}
};

webdav._newUploadProgressListener = function(upload) {
	return upload.onProgress ? this._onUploadProgress.bind(undefined, upload) : null;
};

webdav._putWithWorker = function(upload) {
	if (!this._uploadWorker)
		this._uploadWorker = new UploadWorkerManager();

	this._uploadWorker.upload('PUT', upload.url, upload.data,
		this._onUploadSuccess.bind(this, upload),
		this._onUploadError.bind(this, upload),
		this._newUploadProgressListener(upload));
};

webdav._putFallback = function(upload) {
	var contentType = typeof update.data === 'string' ? 'text/plain' : update.data.type;

	this._request('PUT', upload.url, {
		success: this._onUploadSuccess.bind(this, upload),
		error: this._onUploadError.bind(this, upload),
		uploadProgress: this._newUploadProgressListener(upload),
		headers: {
			'Content-Type': contentType
		},
		data: upload.data
	});
};

webdav._normalizeHref = function(href) {
	return href.lastIndexOf('/') == href.length - 1 ? href.substring(0, href.length - 1) : href;
};

webdav._parsePropfindResult = function(xhr) {
	var docs = [],
	    childNodes = xhr.responseXML.childNodes[0].childNodes;

	for (var i = 0; i < childNodes.length; i++) {
		var response = childNodes[i],
		    doc = {
			'href': null,
			'status': null,
			'properties': {}
		};

		if (response.nodeType != 1) continue;

		for (var j = 0; j < response.childNodes.length; j++) {
			var responseChild = response.childNodes[j];

			if (responseChild.nodeName.toLowerCase() === 'd:href') {
				doc.href = this._normalizeHref(responseChild.textContent).substring(this._rootURL.length);
			} else if (responseChild.nodeName.toLowerCase() === 'd:status') {
				doc.status = responseChild.textContent;
			} else if (responseChild.nodeName.toLowerCase() === 'd:propstat') {
				for (var k = 0; k < responseChild.childNodes.length; k++) {
					var propstatChild = responseChild.childNodes[k];

					if (propstatChild.nodeName.toLowerCase() === 'd:status') {
						doc.status = propstatChild.textContent;
					} else if (propstatChild.nodeName.toLowerCase() === 'd:prop') {
						for (var p = 0; p < propstatChild.childNodes.length; p++) {
							var property = propstatChild.childNodes[p];

							if (property.nodeType != 1) continue;

							var propertyName = property.nodeName.split(':')[1];

							if (propertyName === 'resourcetype' && property.childNodes.length > 0) {
								doc.resourcetype = property.childNodes[0].nodeName.split(':')[1];
							} else {
								var value = property.textContent;

								if (typeof value !== 'undefined' && value !== '') {
									doc.properties[propertyName] = value;
								}
							}
						}
					}
				}
			}
		}

		docs.push(doc);
	}

	return docs;
};


function UploadWorkerManager(uploadLimit) {
	this._uploadLimit = uploadLimit || 1;
	this._pendingUploads = {};
	this._pendingUploadCount = 0;

	// Create upload web worker
	var work = require('webworkify');
	var uploadWorker = require('./upload-worker.js');
	var w = this._worker = work(uploadWorker);
	w.onmessage = this.processWorkerMessage.bind(this);
	w.onerror = this.handleWorkerError.bind(this);
}

UploadWorkerManager.isSupported = function() {
	return window.Worker !== undefined;
};

var uploadManager = UploadWorkerManager.prototype;

uploadManager.processWorkerMessage = function(evt) {
	var data = evt.data;

	try {
		switch(data.type) {
			case 'upload-success':
				this._pendingUploads[data.url].onSuccess();
				delete this._pendingUploads[data.url];
				this._pendingUploadCount--;
				break;
			case 'upload-progress':
				this._pendingUploads[data.url].onProgress(data.loaded, data.total);
				break;
			case 'upload-failed':
				//log.error('Upload ' + data.url + ' failed with status code ' + data.status);
				this._pendingUploads[data.url].onError(data.status);
				delete this._pendingUploads[data.url];
				this._pendingUploadCount--;
				break;
			case 'log':
				throw 'Worker: ' + data.level + ': ' + data.msg;
			default:
				throw "Unsupported message type '" + data.type + "' received from UploadWorker";
		}
	} catch(e) {
		throw 'Error in message processor ' + data.type + ': ' + e;
	}
};

uploadManager.handleWorkerError = function(e) {
	throw 'Worker failure: ' + e;
};

uploadManager.upload = function(method, url, data, onSuccess, onError, onProgress) {
	url = resolveUrl(url);

	if (this._pendingUploads[url])
		return false;

	this._pendingUploads[url] = {
		onSuccess: onSuccess || function() {},
		onProgress: onProgress || function(loaded, total) {},
		onError: onError || function(httpStatus) {}
	};
	this._pendingUploadCount++;
	this._worker.postMessage({
		type: 'upload',
		method: method,
		url: url,
		data: data
	});

	return true;
};

uploadManager.destroy = function() {
	this._worker.terminate();
	this._worker = null;
};

module.exports = WebDavClient;