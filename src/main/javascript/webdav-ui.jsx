var log = require('./logger.js')('WebDavBrowser');
var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var WebDavBrowser = require('./webdav-browser.jsx');
var MediaDisplay = require('./media-display.jsx');

var WebDavUI = React.createClass({
	getDefaultProps: function() {
		return {
			rootURL: '/webdav',
			client: new WebDavClient(),
			getPreviewHref: function(item) {return '';},
			onSelectFile: function(href) {},
			onSelectCollection: function(href) {},
			onCollectionLoaded: function(collection) {}
		};
	},
	getInitialState: function() {
		return {
			currentHref: null
		};
	},
	render: function() {
		return <div>
			<MediaDisplay ref="preview" />
			<WebDavBrowser rootURL={this.props.rootURL}
				client={this.props.client}
				header={<div/>}
				onSelectFile={this.handleFileSelect}
				onSelectCollection={this.handleCollectionSelect}
				onCollectionLoaded={this.handleCollectionLoaded}
				onDropFiles={this.handleFileUpload}
				getPreviewHref={this.props.getPreviewHref}
				ref="browser" />
		</div>;
	},
	select: function(path) {
		this.refs.browser.select(path);
	},
	handleFileSelect: function(href) {
		this.refs.preview.displayMedia({href: href, label: href});
	},
	handleCollectionSelect: function(href) {
		this.state.currentCollectionHref = href;
	},
});

module.exports = WebDavUI;