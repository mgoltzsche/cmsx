var log = require('./logger.js')('CmsxWebDavView');
var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var TreeView = require('./cmsx-tree-view.js');
var MediaView = require('./cmsx-media-view.jsx');

module.exports = React.createClass({
	getDefaultProps: function() {
		return {
			rootPath: '/webdav',
			collectionHref: '',
			client: new WebDavClient()
		};
	},
	getInitialState: function() {
		return {
			collectionHref: null
		};
	},
	componentDidMount: function() {
		this.state.collectionHref = this.props.collectionHref;

		this.show(this.state.collectionHref);
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.collectionHref !== this.props.collectionHref) {
			this.show(nextProps.collectionHref);
		}
	},
	render: function() {
		return <div className="cmsx-webdav-browser">
			<TreeView ref="browser" className="cmsx-webdav-tree"
				onSelect={this.handleBrowserSelect} />
			<MediaView ref="preview" />
		</div>;
	},
	show: function(href) {
		this.state.collectionHref = href;

		if (href === undefined || href === null) {
			this.clear();
		} else {
			var url = this.props.rootPath + href;

			this.props.client.propfind(url, 1, function(davResult) {
				this.onDavLoaded(davResult);
				this.refs.preview.show();
			}.bind(this));
		}
	},
	select: function(item) {
		this.refs.browser.select(item);
	},
	clear: function() {
		this.refs.browser.setParents([]);
		this.refs.browser.setContents([]);
		this.refs.preview.show();
	},
	onDavLoaded: function(davResult) {
		if (davResult.length == 0) {
			// Display empty list
			this.clear();
		} else if (davResult[0].resourcetype !== 'collection') {
			// Show parent collection and select item
			var url = davResult[0].href;

			if (url) {
				var parentUrl = item.href.substring(url, url.lastIndexOf('/'));
				this.props.client.propfind(parentUrl, 1, function(fileUrl, davResult) {
					this.onDavLoaded(davResult);
					this.refs.browser.select(fileUrl);
				}.bind(this, url));
			} else {
				this.clear();
			}
		} else {
			// Show DAV collection
			this.refs.browser.setParents(this.toParentViewModel(davResult[0]));
			this.refs.browser.setContents(davResult.slice(1).map(this.toViewModel));
		}
	},
	toParentViewModel: function(parentDavItem) {
		var parents = [];
		var href = parentDavItem.href;
		var lastSlashPos = href.lastIndexOf('/');

		if (lastSlashPos > 0) {
			var segments = href.substring(1, lastSlashPos).split('/');

			for (var i = 0; i < segments.length; i++) {
				var path = '';

				for (var j = 0; j <= i; j++) {
					path += '/' + segments[j];
				}

				parents.push({
					id: path,
					label: segments[i],
					collection: true
				});
			}
		}

		parents.push(this.toViewModel(parentDavItem));

		return parents;
	},
	toViewModel: function(davItem) {
		var description = davItem.href;
		var props = davItem.properties;

		for (var name in props) {
			if (props.hasOwnProperty(name)) {
				description += "\n  " + name + ': ' + props[name];
			}
		}

		return {
			id: davItem.href,
			label: davItem.href.substring(davItem.href.lastIndexOf('/') + 1),
			description: description,
			collection: davItem.resourcetype === 'collection'
		};
	},
	handleBrowserSelect: function(item) {
		if (item.collection) {
			this.show(item.id.substring(this.props.rootPath.length));
		} else {
			this.refs.preview.show({href: item.id, label: item.label});
		}
	}
});