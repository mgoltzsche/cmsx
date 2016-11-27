var utils = require('./cmsx-utils.js');
var ContextMenu = require('./views/cmsx-context-menu.js');
var TreeView = require('./views/cmsx-tree-view.js');
var Dialog = require('./views/cmsx-dialog.js');
var ConfirmDialog = require('./views/cmsx-confirm-dialog.js');
var Form = require('./views/cmsx-form.js');

function CmsxPageManager(pageService, resourcePicker) {
	utils.bindAll(this);
	this.pageService = pageService;
	this.resourcePicker = resourcePicker;
	this.pagePickerDialog = utils.lazy(this.createPagePickerDialog);
	this.pagePrefsDialog = utils.lazy(this.createPagePrefsDialog);
	this.pageOptions = ContextMenu.options()
		.add('edit', this.showPagePrefsDialog)
		.add('delete', this.deletePage)
		.add('add', this.showPageCreateDialog)
		.add('pick', this.pickPage);
}

var manager = CmsxPageManager.prototype;

manager.destroy = function() {
	this.pagePickerDialog.destroy();
	this.pagePrefsDialog.destroy();
	delete this.pagePickerDialog;
	delete this.pagePrefsDialog;
	delete this.pageOptions;
	delete this.resourcePicker;
	delete this.pageService;
	ContextMenu.destroy();
	ConfirmDialog.destroy();
};

manager.currentPageID = function() {
	var id = window.location.href.match(/([^\/]+)\/index.html(\?|#|$)/)[1];
	return id === 'p' ? '' : id;
};

manager.createPagePickerDialog = function() {
	var dialog = new Dialog('cmsx-list-dialog'),
		treeView = this.createPageTreeView().mount(dialog.contentElement());
	dialog.tree = treeView;
	dialog.onDestroy = treeView.destroy.bind(treeView);
	dialog.prefWidth = 600;
	dialog.prefHeight = 700;
	return dialog;
};

manager.createPageTreeView = function() {
	var pageTreeView = new TreeView(new TreeView.Features()
		.itemClickable(this._handlePageItemClick)
		.itemOptions(this._handlePageOptions)
		.itemCheckable()
		.toolbarButton('delete', this._handleDeleteCheckedPages, 'cmsx-contextual')
		.toolbarButton('add', this._handleAddPage));
	pageTreeView.load = this._loadPageTree.bind(this, pageTreeView);
	return pageTreeView;
};

manager.createPagePrefsDialog = function() {
	var dialog = new Dialog(),
		form = new Form()
		.addInitialInput('id', 'ID')
		.addInput('title', 'Title')
		.addInput('renderer', 'Renderer')
		.addPickableInput('src', 'Content', 'text', this.resourcePicker)
		.addInput('stylesheet', 'XSLT stylesheet')
		.addButton('save', true, this.savePage)
		.mount(dialog.contentElement());
	form.dialog = dialog;
	dialog.form = form;
	dialog.onDestroy = form.destroy.bind(this);
	return dialog;
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
	ContextMenu.show(evt, item.page, this.pageOptions);
};

manager.showPagePrefsDialog = function(page, evt) {
	this.pagePrefsDialog.get().show(evt).form.set(this._toPageProps(page));
};

manager.showPageCreateDialog = function(parentPage, evt) {
	this.showPagePrefsDialog({parent: parentPage.id}, evt); // TODO: handle parent
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

manager.deletePage = function(page) {
	console.log('TODO: delete page');
	//this.pageService.deletePage(page.id);
};

manager.deletePages = function(pages) {
	console.log('TODO: delete pages');
	//this.pageService.deletePage(page.id);
};

manager.pickPage = function(currentPage, evt) {
	this.pagePickerDialog.get().show(evt).tree.load(null);
};

manager._handleAddPage = function(evt, treeView) {
	this.showPageCreateDialog();
};

manager._handleDeleteCheckedPages = function(evt, treeView) {
	var checked = treeView.checked();
	if (checked.length > 0) {
		var labels = checked.reduce(function(labels,item) {
			return labels.length > 200 ? ', ...' : labels === '' ? item.label : labels + ', ' + item.label;
		}, '');
		var message = 'Do you really want to delete ' + labels + '?';
		ConfirmDialog.confirm(evt, message, this.deletePages.bind(this, checked));
	}
};

module.exports = CmsxPageManager;