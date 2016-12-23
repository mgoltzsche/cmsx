var utils = require('../cmsx-utils.js');
var ContextMenu = require('./cmsx-context-menu.js');
var TreeView = require('./cmsx-tree-view.js');
var Dialog = require('./cmsx-dialog.js');
var ConfirmDialog = require('./cmsx-confirm-dialog.js');
var PromptDialog = require('./cmsx-prompt-dialog.js');
var CmsxContainer = require('./cmsx-container.js');
var CmsxButton = require('./cmsx-button.js');
var mediator = require('../cmsx-mediator.js');

function CmsxResourceList(webdav, className) {
	utils.bindAll(this);
	this.webdav = webdav;
	this.currentCollectionHref = '';
	this.resourcePicker = utils.lazy(this.createResourcePickerDialog);
	this.resourceOptions = ContextMenu.options()
		.add('rename', this.showResourceRenameDialog)
    	.add('move', this.showResourceMoveDialog)
    	.add('delete', this.showResourceDeleteDialog);
	this._fileInput = document.createElement('input');
	this._fileInput.type = 'file';
	this._fileInput.style.display = 'none';
	this._fileInput.addEventListener('change', this.uploadFiles);
	this._treeView = new TreeView(new TreeView.Features()
		.itemClickable(this.selectResource)
		.itemOptions(this.showResourceOptions)
		.itemCheckable()
		.toolbarButton('delete', this.showCheckedResourcesDeleteDialog, 'cmsx-contextual')
		.toolbarButton('upload', this.showUploadDialog)
		.toolbarButton('new collection', this.showCreateCollectionDialog), className);
	this._mediator = mediator.newLocalInstance('cmsx.resource')
		.event('createdCollection', this.createdCollection)
		.event('uploadedFile', this.uploadedFile)
		.event('deletedResource', this.deletedResource)
		.event('movedResource', this.movedResource);
	document.body.appendChild(this._fileInput); // TODO: move into button component
}

var resourceList = CmsxResourceList.prototype;
resourceList.fileNamePattern = /^[^\/\\?%*:|"'<>]+$/; // Taken from https://en.wikipedia.org/wiki/Filename
resourceList.rootItemLabel = 'resources';

resourceList.destroy = function() {
	this._treeView.destroy();
	this.resourcePicker.destroy();
	this._fileInput.parentElement.removeChild(this._fileInput);
	this._fileInput.removeEventListener('change', this.uploadFiles);
	this._mediator.destroy();
	delete this.resourcePicker;
	delete this.resourceOptions;
	delete this._treeView;
	delete this._mediator;
	delete this.webdav;
};

/**
 * Returns this controller's outer element for view compatibility.
 */
resourceList.element = function() {
	return this._treeView.element();
};

resourceList.createResourcePickerDialog = function() {
	return new CmsxResourcePicker(this.webdav);
};

resourceList.pickResource = function(evt, currentValue, callback) {
	this.resourcePicker.get().pickResource(evt, currentValue, callback);
};

resourceList.update = function() {
	this.load(this.selectedResource);
};

resourceList.load = function(href, selectHref) {
	var url = href || '',
		callback = this._handleDavLoaded.bind(this, selectHref);

	this.currentCollectionHref = url;
	this.webdav.davPropfind(url, 1, callback);
};

resourceList.selectResource = function(evt, item) {
	this.selectedResource = item.id;

	if (item.collection) {
		this.load(this.selectedResource);
	} else {
		// TODO: show media
	}
};

resourceList._handleDavLoaded = function(childFileUrl, davResult) {
	var url = davResult[0].href;
	if (davResult[0].resourcetype !== 'collection') {
		// Load parent collection since loaded resource is not a collection
		this.load(url.substring(0, url.lastIndexOf('/')), url);
	} else {
		// Show loaded DAV collection
		this.currentCollectionHref = url;
		this._treeView.setAncestors(this._toParentViewModel(davResult[0]));
		this._treeView.setChildren(davResult.slice(1).map(this._toViewModel));
	}
};

resourceList._toParentViewModel = function(parentDavItem) {
	var path, slashPos, segmentPos = 1,
		parents = [],
		href = parentDavItem.href;

	parents.push({
		id: '',
		label: this.rootItemLabel,
		collection: true
	});

	if (href) {
		while ((slashPos = href.indexOf('/', segmentPos)) > -1) {
			parents.push({
				id: href.substring(0, slashPos),
				label: decodeURIComponent(href.substring(segmentPos, slashPos)),
				collection: true
			});
			segmentPos = slashPos + 1;
		}

		parents.push(this._toViewModel(parentDavItem));
	}

	return parents;
};

resourceList._toViewModel = function(davItem) {
	var name,
		description = davItem.href,
		props = davItem.properties;

	for (name in props) {
		if (props.hasOwnProperty(name)) {
			description += "\n  " + name + ': ' + props[name];
		}
	}

	return {
		id: davItem.href,
		label: this.toFileName(davItem.href),
		description: description,
		collection: davItem.resourcetype === 'collection'
	};
};

resourceList.showResourceOptions = function(evt, item) {
	ContextMenu.show(evt, item, this.resourceOptions);
};

resourceList.showResourceRenameDialog = function(evt, item) {
	var currentName = this.toFileName(item.id);
	PromptDialog.prompt(evt, 'Please enter the collection\'s new name', currentName, this.renameResource.bind(this, item));
};

resourceList.renameResource = function(item, newName, evt) {
	var normalizedName = this.normalizeName(newName),
		newNameEnc = newName = encodeURIComponent(newName),
		href = item.id,
		dest = this.toParentHref(href) + '/' + newNameEnc;

	if (normalizedName === newName) {
		this.webdav.davMove(href, dest, this._mediator.movedResource);
	} else {
		item = {id: this.toParentHref(href) + '/' + normalizedName};
		this.showResourceRenameDialog(evt, item);
	}
};

resourceList.showResourceMoveDialog = function(evt, item) {
	var parentHref = this.toParentHref(item.id);
	this.pickResource(evt, parentHref, this.moveResource.bind(this, item));
};

resourceList.moveResource = function(item, destParentHref, evt) {
	var href = item.id,
		fileName = encodeURIComponent(this.toFileName(href)),
		dest = destParentHref + '/' + fileName;
	if (dest.indexOf(href) !== 0) {
		this.webdav.davMove(href, dest, this._mediator.movedResource);
	} else {
		this.showResourceMoveDialog(evt, item);
	}
};

resourceList.movedResource = function(href, dest) {
	var parentHref = this.toParentHref(href);

	if (parentHref === this.currentCollection) {
		this.update();
	} else if (this.currentCollectionHref.indexOf(href) === 0) {
		this.load(dest);
	}
};

resourceList.toFileName = function(href) {
	return decodeURIComponent(href.substring(href.lastIndexOf('/') + 1));
};

resourceList.toParentHref = function(href) {
	return href.substring(0, href.lastIndexOf('/'));
};

resourceList.normalizeNamePattern = /[^a-z0-9_\-\.]+/g;

resourceList.normalizeName = function(name) {
	return name.toLowerCase().replace(this.normalizeNamePattern, '-');
};

resourceList.showResourceDeleteDialog = function(evt, items) {
	if (items.length === undefined) items = [items];
	else if (items.length === 0) return;
	var labels = items.reduce(function(labels,item) {
		return labels.length > 200 ? ', ...' : labels === '' ? item.label : labels + ', ' + item.label;
	}, '');
	var message = 'Do you really want to delete ' + labels + '?';
	ConfirmDialog.confirm(evt, message, this.deleteResources.bind(this, items));
};

resourceList.showCheckedResourcesDeleteDialog = function(evt) {
	this.showResourceDeleteDialog(evt, this._treeView.checked());
};

resourceList.deleteResources = function(items) {
	for (var i = 0; i < items.length; i++) {
		this.webdav.davDelete(items[i].id, this._mediator.deletedResource);
	}
};

resourceList.deletedResource = function(href) {
	var parentHref = this.toParentHref(href);

	if (parentHref === this.currentCollectionHref || this.currentCollectionHref.indexOf(href) === 0) {
		this.load(parentHref);
	}
};

resourceList.showUploadDialog = function(evt) {
	this._fileInput.click();
};

resourceList.uploadFiles = function(evt) {
	evt = evt || window.event;
	var files = (evt.target || evt.srcElement).files;

	if (files.length === 0) {
		return;
	}

	// Invoke uploads
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		this.webdav.davPut(this.currentCollectionHref + '/' + file.name, file, this._mediator.uploadedFile);
	}

	// Reset input field
	try {
		input.value = '';
		if (input.value) {
			input.type = 'text';
			input.value = '';
			setTimeout(function(){input.type = 'file';});
		}
	} catch(e) {}
};

resourceList.uploadedFile = function(href) {
	if (this.toParentHref(href) === this.currentCollectionHref) {
		this.update();
	}
};

resourceList.showCreateCollectionDialog = function(evt, name) {
	PromptDialog.prompt(evt, 'Please enter the name of your new collection', name || '', this.createCollection);
};

resourceList.createCollection = function(name, evt) {
	if (name && this.fileNamePattern.test(name)) {
		this.webdav.davMkcol(this.currentCollectionHref + '/' + encodeURIComponent(name), this._mediator.createdCollection);
	} else {
		// TODO: Show error
		this.showCreateCollectionDialog(evt);
	}
};

resourceList.createdCollection = function(href) {
	if (this.toParentHref(href) === this.currentCollectionHref) {
		this.update();
	}
};


function CmsxResourcePicker(webdav) {
	utils.bindAll(this);
	this.tree = new CmsxResourceList(webdav, 'cmsx-vgrid-content cmsx-resource-picker');
	this.dialog = new Dialog('cmsx-vgrid').prefSize(600, 700)
		.add(this.tree)
		.add(new CmsxContainer('div', 'cmsx-vgrid-footer cmsx-align-center')
			.add(new CmsxButton('select', this.resourcePicked)));
	this.destroy = this.dialog.destroy;
}

var resourcePicker = CmsxResourcePicker.prototype;

resourcePicker.pickResource = function(evt, currentValue, callback) {
	this.tree.selectedResource = currentValue || null;
	this._callback = callback;
	this.tree.load(this.tree.selectedResource);
	this.dialog.show(evt);
};

resourcePicker.resourcePicked = function(evt) {
	this.dialog.hide(evt);
	var callback = this._callback;
	this._callback = null;
	callback(this.tree.selectedResource, evt);
};

CmsxResourceList.ResourcePicker = CmsxResourcePicker;
module.exports = CmsxResourceList;
