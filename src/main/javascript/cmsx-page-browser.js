var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var TreeView = React.createFactory(require('./cmsx-tree-view.js'));
var CmsxService = require('./cmsx-service.js');

var CmsxPageBrowser = React.createClass({
	getDefaultProps: function() {
		return {
			pageID: null,
			service: new CmsxService(''),
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
			onSelect: this.handlePageSelect,
			onOptions: this.props.onPageOptions
		});
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
	},
	onPageLoaded: function(page) {
		page.parents.push(page);
		this.refs.browser.setParents(page.parents.map(this.toViewModel));
		this.refs.browser.setContents(page.children.map(this.toViewModel));
	},
	toViewModel: function(page) {
		page.id = page.id || '';
		page.label = page.title || page.id;
		return page;
	},
	handlePageSelect: function(page) {
		this.show(page.id);
		this.props.onPageSelect(page);
	},
	editItem: function(item) {
		this.props.service.editPage(item);
	},
	deleteItem: function(item) {
		console.log('delete');
	},
	addItem: function(item) {
		this.props.service.editPage({parent: item.id});
	}
});

module.exports = CmsxPageBrowser;