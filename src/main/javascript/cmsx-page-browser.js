var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var TreeView = React.createFactory(require('./cmsx-tree-view.js'));
var CmsxService = require('./cmsx-service.js');

var CmsxPageBrowser = React.createClass({
	getDefaultProps: function() {
		return {
			pageID: null,
			loader: function(pageID, success) {},
			onPageSelect: function(page) {},
			onPageOptions: null
		};
	},
	getInitialState: function() {
		return {};
	},
	componentDidMount: function() {
		this.show(this.props.pageID);
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.pageID != this.props.pageID) {
			this.show(this.props.pageID);
		}
	},
	render: function() {
		return TreeView({
			ref: 'browser',
			className: 'cmsx-page-tree',
			onSelect: this.handleSelect,
			onOptions: this.props.onPageOptions ? this.handleOptions : null
		});
	},
	show: function(pageID) {
		if (typeof pageID === 'string') {
			this.props.loader(pageID, this.onPageLoaded);
		} else {
			this.clear();
		}
	},
	clear: function() {
		this.refs.browser.setParents([]);
		this.refs.browser.setContents([]);
	},
	onPageLoaded: function(page) {
		page.parents.push(page);
		this.refs.browser.setParents(page.parents.map(this.toViewModel));
		this.refs.browser.setContents(page.children.map(this.toViewModel));
	},
	toViewModel: function(page) {
		return {
			id: page.id || '',
			label: page.title || page.id,
			page: page
		};
	},
	handleSelect: function(item) {
		this.show(item.id);
		this.props.onPageSelect(item.page);
	},
	handleOptions: function(item, evt) {
		this.props.onPageOptions(item.page, evt);
	}
});

module.exports = CmsxPageBrowser;