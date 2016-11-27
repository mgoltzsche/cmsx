var utils = require('./cmsx-utils.js');
var MediumEditor = require('medium-editor');
var WebDavClient = require('./services/webdav-client.js');
var ContextMenu = require('./views/cmsx-context-menu.js');
var TreeView = require('./views/cmsx-tree-view.js');
var Dialog = require('./views/cmsx-dialog.js');
var ConfirmDialog = require('./views/cmsx-confirm-dialog.js');

function CmsxResourceManager(webdavClient, rootURL) {
	utils.bindAll(this);
	this.webdav = webdavClient;
	this.rootURL = rootURL;
	this.resourcePickerDialog = utils.lazy(this.createResourcePickerDialog);
	this.resourceOptions = ContextMenu.options()
		.add('rename', this.showResourceRenameDialog)
    	.add('move', this.showResourceMoveDialog)
    	.add('delete', this.showResourceDeleteDialog);
}

var manager = CmsxResourceManager.prototype;

manager.destroy = function() {
	this.resourcePickerDialog.destroy();
	delete this.resourcePickerDialog;
	delete this.resourceOptions;
	delete this.webdav;
	ContextMenu.destroy();
	ConfirmDialog.destroy();
};

manager.createResourcePickerDialog = function() {
	var dialog = new Dialog(),
		treeView = this.createResourceTreeView().mount(dialog.contentElement());
	dialog.tree = treeView;
	dialog.onDestroy = treeView.destroy.bind(treeView);
	return dialog;
};

manager.createResourceTreeView = function() {
	var resourceTreeView = new TreeView(new TreeView.Features()
		.itemClickable(this._handleResourceItemClick)
		.itemOptions(this._handleResourceOptions)
		.itemCheckable()
		.toolbarButton('delete', this._handleDeleteResources, 'cmsx-contextual')
		.toolbarButton('upload', this._handleCreateResourceButtonClick)
		.toolbarButton('new collection', this._handleCreateCollectionButtonClick));
	resourceTreeView.load = this._loadCollection.bind(this, resourceTreeView);
	return resourceTreeView;
};

manager.pickResource = function(evt, setter, currentValue) {
	this.resourcePickerDialog.get().show(evt).tree.load(currentValue || null);
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
	treeView.clear();
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

manager._handleResourceOptions = function(item, evt) {
	ContextMenu.show(evt, item, this.resourceOptions);
};

manager.showResourceRenameDialog = function(item) {
	// TODO: 
};

manager.showResourceMoveDialog = function(item) {
	// TODO: 
};

manager.showResourceDeleteDialog = function(items, evt) {
	if (items.length === undefined) items = [items];
	else if (items.length === 0) return;
	var labels = items.reduce(function(labels,item) {
		return labels.length > 200 ? ', ...' : labels === '' ? item.label : labels + ', ' + item.label;
	}, '');
	var message = 'Do you really want to delete ' + labels + '?';
	ConfirmDialog.confirm(evt, message, this.deleteResources.bind(this, items));
};

manager.deleteResources = function(items) {
	console.log('delete resources');
	console.log(items);
};

manager._handleCreateResourceButtonClick = function(evt, treeView) {
	console.log('upload');
};

manager._handleCreateCollectionButtonClick = function(evt, treeView) {
	console.log('add resource');
};

manager._handleDeleteResources = function(evt, treeView) {
	this.showResourceDeleteDialog(treeView.checked(), evt);
};

module.exports = CmsxResourceManager;