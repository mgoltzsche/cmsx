var utils = require('./cmsx-utils.js');
var MediumEditor = require('medium-editor');
var CmsxService = require('./services/cmsx-service.js');
var WebDavClient = require('./services/webdav-client.js');
var ContextMenu = require('./views/cmsx-context-menu.js');
var TreeView = require('./views/cmsx-tree-view.js');

function CmsxResourceManager(webdavClient, rootURL) {
	this.webdav = webdavClient;
	this.rootURL = rootURL;
	utils.bindAll(this);
}

var manager = CmsxResourceManager.prototype;

manager.createResourceTreeView = function(parentElement) {
	var resourceTreeView = new TreeView(parentElement, {
		onItemClick: this._handleResourceItemClick,
		onItemOptions: this._handleResourceOptions,
		checkable: true
	});
	resourceTreeView.load = this._loadCollection.bind(this, resourceTreeView);
	return resourceTreeView;
};

manager.pickResource = function(setter, currentValue) {
	
};

manager._loadCollection = function(treeView, href, selectHref) {
	var url = this.rootURL + (href || ''),
		callback = this._handleDavLoaded.bind(this, treeView, selectHref);

	this.webdav.propfind(url, 1, callback);

	return treeView;
};

manager._handleResourceItemClick = function(item, evt, treeView) {
	if (item.collection) {
		this._loadCollection(treeView, item.id.substring(this.rootURL.length));
	} else {
		// TODO: show media
	}
};

manager._handleResourceOptions = function(item, evt) {
	
};

manager._clearTreeView = function(treeView) {
	treeView.setAncestors([]);
	treeView.setChildren([]);
};

manager._handleDavLoaded = function(treeView, childFileUrl, davResult) {
	if (davResult.length > 0) {
		if (davResult[0].resourcetype !== 'collection') {
			// Load parent collection since loaded resource is not a collection
			var url = davResult[0].href,
				parentUrl = url.substring(0, url.lastIndexOf('/'));

			this._loadCollection(treeView, parentUrl, url);
			return;
		} else {
			// Show loaded DAV collection
			treeView.setAncestors(this._toParentViewModel(davResult[0]));
			treeView.setChildren(davResult.slice(1).map(this._toViewModel));
			// TODO: treeView.selectedItem = selectItemByURL;
			return;
		}
	}

	// Display empty list (shouldn't happen)
	this._clearTreeView(treeView);
};

manager._toParentViewModel = function(parentDavItem) {
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

	parents.push(this._toViewModel(parentDavItem));

	return parents;
};

manager._toViewModel = function(davItem) {
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
};

module.exports = CmsxResourceManager;