var log = require('./logger.js')('CmsxMediaView');
var React = require('react');
var ReactDOM = require('react-dom');
var ImageView = require('./cmsx-image-view.jsx');
var MediaPlayer = require('./cmsx-media-player.jsx');

var MediaView = React.createClass({
	getDefaultProps: function() {
		return {
			className: '',
			media: null,
			displayTypes: {
				'jpg': 'image',
				'jpeg': 'image',
				'png': 'image',
				'gif': 'image',
				'mp4': 'stream',
				'mp3': 'stream',
				'txt': 'iframe',
				'html': 'iframe',
				'xhtml': 'iframe'
			},
			rewriteImageHref: function(href, width, height) {
				return href;
			},
			rewriteStreamHref: function(href) {
				return href;
			},
			preferredContentSize: function(width, height, scaleProportional) {}
		};
	},
	getInitialState: function() {
		return {
			prefWidth: 100,
			prefHeight: 100,
			media: null,
			display: this.displays.hidden
		};
	},
	componentDidMount: function() {
		this._keyupListener = function(e) {
			if (e.keyCode === 39) {
				this.next();
			} else if (e.keyCode === 37) {
				this.previous();
			}
		}.bind(this);

		if (this.props.media)
			this.show(this.props.media);
	},
	componentWillUpdate: function(nextProps, nextState) {
		this.show(nextProps.media);
	},
	displays: {
		image: {
			name: 'image',
			show: function(self, media) {
				var maxWidth = self.refs.container.offsetWidth;
				var maxHeight = self.refs.container.offsetHeight;
				var href = self.props.rewriteImageHref(media.href, maxWidth, maxHeight);
				self._lastRewrittenImageHref = href;
				self.refs.image.showImage(href);
			},
			clear: function(self) {
				self.refs.image.showImage();
			},
			onResize: function(self, maxWidth, maxHeight) {
				var media = self.state.media;
				var href = self.props.rewriteImageHref(media.href, maxWidth, maxHeight);

				if (href !== self._lastRewrittenImageHref) {
					self._lastRewrittenImageHref = href;
					self.refs.image.showImage(href);
				}
			}
		},
		stream: {
			name: 'stream',
			show: function(self, media) {
				self.props.preferredContentSize(720, 480);
				self.refs.stream.show(self.props.rewriteStreamHref(media.href));
			},
			clear: function(self) {
				self.refs.stream.hide();
			},
			onResize: function(self, maxWidth, maxHeight) {}
		},
		iframe: {
			name: 'iframe',
			show: function(self, media) {
				self.refs.iframe.src = media.href;
				self.props.preferredContentSize(1000, 1000, false);
			},
			clear: function(self) {
				self.refs.iframe.src = '';
			},
			onResize: function(self, maxWidth, maxHeight) {
				self.props.preferredContentSize(maxWidth, maxHeight, false);
			}
		},
		download: {
			name: 'download',
			show: function(self, media) {
				self.refs.download.href = media.href;
				self.props.preferredContentSize(320, 240, true);
			},
			clear: function() {},
			onResize: function() {}
		},
		hidden: {
			name: 'hidden',
			show: function() {},
			clear: function() {},
			onResize: function() {}
		}
	},
	show: function(media) {
		if (!media) {
			this.hide();
			return;
		}

		if (typeof media == 'string') {
			media = {href: media, label: media};
		}

		var active = this.state.display !== this.displays.hidden;

		if (active && media === this.state.media)
			return;

		this.state.media = media;

		if (!active)
			this.props.preferredContentSize(100, 100, false);

		this._update();
	},
	_update: function() {
		var media = this.state.media;
		var href = media.href;
		var label = media.label;
		var extension = href.split('.').pop().toLowerCase();
		var displayType = this.props.displayTypes[extension] || 'download';
		var display = this.displays[displayType];

		if (!display)
			throw 'Unsupported media display type: ' + displayType;

		// Hide last display if different media format
		if (display !== this.state.display)
			this.state.display.clear(this);

		// Show new display with href
		this.state.display = display;
		this.state.display.show(this, media);

		// Show display element
		this.refs.container.className = 'cmsx-media cmsx-media-' + this.state.display.name + ' ' + this.props.className;
	},
	hide: function() {
		if (this.state.display !== this.displays.hidden) {
			this.state.display.clear(this);
			this.state.display = this.displays.hidden;
		}
	},
/*	handleResize: function(maxWidth, maxHeight) {
		this.state.display.onResize(this, maxWidth, maxHeight);
	},*/
	handleImageLoaded: function(href, width, height) {
		this.props.preferredContentSize(width, height, true);
	},
	render: function() {
		return <div ref="container">
			<ImageView onLoad={this.handleImageLoaded} ref="image" />
			<MediaPlayer width="100%" height="100%" ref="stream" />
			<iframe className="cmsx-media-iframe" width="100%" height="100%" ref="iframe" />
			<a className="cmsx-button primary cmsx-download" title="Download" ref="download">Download</a>
		</div>
	}
});

module.exports = MediaView;