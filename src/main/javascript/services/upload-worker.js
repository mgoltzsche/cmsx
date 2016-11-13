var log = function(level, msg, err) {
	postMessage({
		type: 'log',
		level: level,
		msg: msg + (err ? ': ' + err + "\n" + (err.stack ? err.stack : '') : '')
	});
};

var $ = require('jquery');

module.exports = function(self) {
	var onMessage = function(evt) {
		var data = evt.data;

		try {
			var contentType = typeof data.data === 'string' ? 'text/plain' : data.data.type;

			switch(data.type) {
				case 'upload':
					$.ajax({
						method: data.method,
						url: data.url,
						error: function(xhr, textStatus, error) {
							postMessage({
								type: 'upload-failed',
								url: data.url,
								status: xhr.status
							});
						},
						xhr: function() {
							var xhr = new window.XMLHttpRequest();
							xhr.upload.addEventListener('progress', function(evt) {
								postMessage({
									type: 'upload-progress',
									url: data.url,
									loaded: evt.loaded,
									total: evt.total
								});
							}, false);
							return xhr;
						},
						headers: {
							'Content-Type': contentType
						},
						data: data.data
					});
					break;
				default:
					log('ERROR', 'Unsupported message type: ' + data.type + ". Expecting message: {type: '<type>', msg: <message>}");
			}
		} catch(e) {
			log('ERROR', 'Error in message processor: ' + data.type, e);
		}
	};

	try {
		self.addEventListener('message', onMessage);
	} catch(e) {
		log('ERROR', 'Worker internal initialization failed', e);
	}
};