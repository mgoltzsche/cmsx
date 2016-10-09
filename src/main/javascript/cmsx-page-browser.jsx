var React = require('react');
var ReactDOM = require('react-dom');
var WebDavClient = require('./webdav-client.js');
var TreeView = require('./cmsx-tree-view.jsx');
var CmsxPagePreferences = require('./cmsx-page-preferences.jsx');
var CmsxService = require('./cmsx-service.js');
var absUrlRegex = /^https?:\/\//

var CmsxPageBrowser = React.createClass({
	getDefaultProps: function() {
		return {
			page: '',
			service: new CmsxService('')
		};
	},
	getInitialState: function() {
		return {
			rootURL: '',
		};
	},
	componentDidMount: function() {
		var pageHref = this.props.page;
		if (!pageHref) {
			pageHref = window.location.href;
			var suffixPos = pageHref.indexOf('?') || pageHref.indexOf('#');
			if (suffixPos < -1) {
				pageHref = pageHref.substring(0, suffixPos);
			}
			pageHref = pageHref.substring(0, pageHref.length - 5) + 'service';
		}
		this.show(pageHref);
	},
	componentWillUpdate: function(nextProps, nextState) {
		nextState.rootURL = this.state.rootURL;
		if (nextProps.page !== this.props.page) {
			this.show(this.props.page);
		}
	},
	render: function() {
		return <div className="cmsx-webdav-browser">
			<TreeView ref="browser" className="cmsx-webdav-tree"
				onSelectParent={this.handlePageSelect}
				onSelectContent={this.handlePageSelect} />
			<CmsxPagePreferences ref="preferences" />
		</div>;
	},
	show: function(href) {
		if (href === undefined || href === null) {
			this.clear();
		} else {
			var url = href.match(absUrlRegex) ? href : this.state.rootURL + href;

			this.props.service.loadPage(url, this.onPageLoaded.bind(this, href));
		}
	},
	clear: function() {
		this.refs.browser.setParents([]);
		this.refs.browser.setContents([]);
//		this.refs.preview.show();
	},
	onPageLoaded: function(href, page) {
		if (this.state.rootURL === '') { // Derive rootURL for following requests
			this.state.rootURL = href.substring(0, href.length - (page.href + '/index.service').length);
		}

		page.parents.push(page);
		this.refs.browser.setParents(page.parents.map(this.toViewModel));
		this.refs.browser.setContents(page.children.map(this.toViewModel));
		this.refs.preferences.setPage(page);
	},
	toViewModel: function(page) {
		page.label = page.title || page.id;
		return page
	},
	handlePageSelect: function(item) {
		this.show(item.href + '/index.service');
	}
});

module.exports = CmsxPageBrowser;