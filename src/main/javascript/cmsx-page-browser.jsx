var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var TreeView = require('./cmsx-tree-view.js');
var CmsxPagePreferences = require('./cmsx-page-preferences.jsx');
var CmsxService = require('./cmsx-service.js');

var CmsxPageBrowser = React.createClass({
	getDefaultProps: function() {
		return {
			pageID: null,
			service: new CmsxService('')
		};
	},
	getInitialState: function() {
		return {};
	},
	componentDidMount: function() {
		this.show(this.props.pageID);
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.pageID !== this.props.pageID) {
			this.show(this.props.pageID);
		}
	},
	render: function() {
		return <div className="cmsx-webdav-browser">
			<TreeView ref="browser" className="cmsx-webdav-tree"
				onSelectParent={this.handlePageSelect}
				onSelectContent={this.handlePageSelect} />
			<CmsxPagePreferences ref="preferences" onSave={this.onPageSave} />
		</div>;
	},
	show: function(pageID) {
		if (typeof pageID === 'string') {
			this.props.service.loadPage(pageID, this.onPageLoaded);
		} else {
			this.clear();
		}
	},
	clear: function() {
		this.refs.browser.setParents([]);
		this.refs.browser.setContents([]);
		this.refs.preferences.setPage();
	},
	onPageLoaded: function(page) {
		page.parents.push(page);
		this.refs.browser.setParents(page.parents.map(this.toViewModel));
		this.refs.browser.setContents(page.children.map(this.toViewModel));
		this.refs.preferences.setPage(this.pageAttrs(page));
	},
	pageAttrs: function(page) {
		var attrs = {};

		for (var k in page) {
			if (page.hasOwnProperty(k) && typeof k === 'string' && typeof page[k] === 'string') {
				attrs[k] = page[k];
			}
		}

		return attrs;
	},
	toViewModel: function(page) {
		page = this.pageAttrs(page);
		page.id = page.id || '';
		page.label = page.title || page.id;
		return page;
	},
	onPageSave: function(page) {
		this.props.service.updatePage(page, this.handlePageSelect);
	},
	handlePageSelect: function(page) {
		this.show(page.id);
	}
});

module.exports = CmsxPageBrowser;