var utils = require('./cmsx-utils.js');
var MediumEditor = require('medium-editor');
var CmsxService = require('./services/cmsx-service.js');
var WebDavClient = require('./services/webdav-client.js');
var ContextMenu = require('./views/cmsx-context-menu.js');
var TreeView = require('./views/cmsx-tree-view.js');
var createDialog = require('./views/cmsx-dialog.js');
var form = require('./views/cmsx-form.js');

function CmsxPageManager(pageService, resourcePicker) {
	utils.bindAll(this);
	this.pageService = pageService;
	this.resourcePicker = resourcePicker;
}

var manager = CmsxPageManager.prototype;

manager.currentPageID = function() {
	var id = window.location.href.match(/([^\/]+)\/index.html(\?|#|$)/)[1];
	return id === 'p' ? '' : id;
};

manager.createPageTreeView = function(parentElement) {
	var pageTreeView = new TreeView(parentElement, new TreeView.Features()
		.itemClickable(this._handlePageItemClick)
		.itemOptions(this._handlePageOptions)
		.itemCheckable()
		.toolbarButton('delete', 'cmsx-contextual', function(evt, listView) {
			console.log('delete selected pages');
			console.log(listView.checked());
		})
		.toolbarButton('add', null, function(evt, listView) {
			console.log('add page');
		}));
	pageTreeView.load = this._loadPageTree.bind(this, pageTreeView);
	return pageTreeView;
};

manager._loadPageTree = function(treeView, pageID) {
	if (typeof pageID !== 'string') pageID = this.currentPageID();
	this.pageService.loadPage(pageID, this._handlePagesLoaded.bind(this, treeView));
	return treeView;
};

manager._handlePagesLoaded = function(treeView, page) {
	page.parents.push(page);
	treeView.setAncestors(page.parents.map(this._toPageViewModel));
	treeView.setChildren(page.children.map(this._toPageViewModel));
};

manager._toPageViewModel = function(page) {
	return {
		id: page.id || '',
		label: page.title || page.id,
		page: page
	};
};

manager._handlePageItemClick = function(item, evt, treeView) {
	this._loadPageTree(treeView, item.id);
};

manager._handlePageOptions = function(item, evt) {
	if (!this._pageContextMenu) {
		this._pageContextMenu = new ContextMenu([
     		{
    			label: 'edit',
    			callback: this.showPageEditDialog
    		},
    		{
    			label: 'delete',
    			callback: this.deletePage
    		},
    		{
    			label: 'add',
    			callback: this.showPageCreateDialog
    		},
    		{
    			label: 'pick',
    			callback: this.pickPage
    		}
    	]);
	}

	this._pageContextMenu.show(evt, item.page);
};

manager.showPageEditDialog = function(page) {
	if (!this._pagePreferencesForm) {
		this._pagePreferencesDialog = createDialog();
		this._pagePreferencesForm = new form.CmsxForm()
			.addInitialInput('id', 'ID')
			.addInput('title', 'Title')
			.addInput('renderer', 'Renderer')
			.addPickableInput('src', 'Content', 'text', this.resourcePicker)
			.addInput('stylesheet', 'XSLT stylesheet')
			.addButton('save', true, this.savePage);
		this._pagePreferencesForm.dialog = this._pagePreferencesDialog;
		this._pagePreferencesForm.init(this._pagePreferencesDialog.contentElement());
	}

	this._pagePreferencesForm.set(this._toPageProps(page));
	this._pagePreferencesDialog.show();
};

manager.savePage = function(form, evt) {
	console.log(form.get());
	this.pageService.updatePage(form.get(), function() {
		form.dialog.hide();
	});
};

manager._toPageProps = function(page) {
	var props = {};
	for (var k in page) {
		if (page.hasOwnProperty(k) && typeof page[k] === 'string') {
			props[k] = page[k];
		}
	}
	return props;
};

manager.showPageCreateDialog = function(parentPage) {
	this.showPageEditDialog({parent: parentPage.id}); // TODO: handle parent
};

manager.deletePage = function(page) {
	console.log('TODO: delete page');
	//this.pageService.deletePage(page.id);
};

manager.pickPage = function(setter, currentValue) {
	if (!this._pagePicker) {
		this._pagePickerDialog = createDialog({preferredWidth: 500, preferredHeight: 500});
		var pageID = this.currentPageID();
		this._pagePicker = this.createPageTreeView(this._pagePickerDialog.contentElement());
	}

	this._pagePicker.load(currentValue || null);
	this._pagePickerDialog.show();
};

module.exports = CmsxPageManager;