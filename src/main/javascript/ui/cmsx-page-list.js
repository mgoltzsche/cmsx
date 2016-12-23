var utils = require('../cmsx-utils.js');
var ContextMenu = require('./cmsx-context-menu.js');
var TreeView = require('./cmsx-tree-view.js');
var Dialog = require('./cmsx-dialog.js');
var ConfirmDialog = require('./cmsx-confirm-dialog.js');
var Form = require('./cmsx-form.js');
var CmsxContainer = require('./cmsx-container.js');
var CmsxButton = require('./cmsx-button.js');
var mediator = require('../cmsx-mediator.js');

function CmsxPageList(pageService, resourcePicker, className) {
	utils.bindAll(this);
	this.pageService = pageService;
	this.resourcePicker = resourcePicker;
	this.pagePicker = utils.lazy(this.createPagePickerDialog);
	this.pagePrefsDialog = utils.lazy(this.createPagePrefsDialog);
	this.pageOptions = ContextMenu.options()
		.add('edit', this.showPagePrefsDialog)
		.add('delete', this.showPageDeleteDialog)
		.add('add', this.showPageCreateDialog)
		.add('pick', this.pickPage);
	this.mediator = mediator.newLocalInstance('cmsx.page')
		.event('updated', this.updatedPage)
		.event('deleted', this.deletedPage)
		.event('moved', this.movedPage);
	this.treeView = new TreeView(new TreeView.Features()
		.itemClickable(this.selectPage)
		.itemOptions(this.showPageOptions)
		.itemCheckable()
		.orderable(this.requestMove)
		.toolbarButton('delete', this.showCheckedPagesDeleteDialog, 'cmsx-contextual')
		.toolbarButton('add', this.showPageCreateDialog), className);
}

var pageList = CmsxPageList.prototype;

pageList.destroy = function() {
	this.pagePicker.destroy();
	this.pagePrefsDialog.destroy();
	this.treeView.destroy();
	this.mediator.destroy();
	delete this.pagePicker;
	delete this.pagePrefsDialog;
	delete this.pageOptions;
	delete this.resourcePicker;
	delete this.pageService;
	delete this.treeView;
};

pageList.element = function() {
	return this.treeView.element();
};

pageList.contextPageID = function() {
	var id = window.location.href.match(/([^\/]+)\/index.html(\?|#|$)/)[1];
	return id === 'p' ? '' : id;
};

pageList.createPagePickerDialog = function() {
	return new CmsxPagePicker(this.pageService, this.resourcePicker);
};

pageList.createPagePrefsDialog = function() {
	return new CmsxPagePreferences(this.pageService, this.resourcePicker);
};

pageList.load = function(pageID) {
	this.currentPageID = pageID;
	if (typeof pageID !== 'string') pageID = this.contextPageID();
	this.pageService.loadPage(pageID, this.onPagesLoaded);
};

pageList.onPagesLoaded = function(page) {
	page.parents.push(page);
	this.treeView.setAncestors(page.parents.map(this.toPageViewModel));
	this.treeView.setChildren(page.children.map(this.toPageViewModel));
};

pageList.toPageViewModel = function(page) {
	return {
		id: page.id || '',
		label: page.title || page.id,
		page: page
	};
};

pageList.selectPage = function(evt, item) {
	this.load(item.id);
};

pageList.showPageOptions = function(evt, item) {
	ContextMenu.show(evt, item, this.pageOptions);
};

pageList.showPagePrefsDialog = function(evt, item, parentPageID) {
	this.pagePrefsDialog.get().editPage(evt, item.page, parentPageID);
};

pageList.showPageCreateDialog = function(evt, parentPageItem) {
	var parentPageID = parentPageItem ? parentPageItem.id : this.currentPageID;
	this.showPagePrefsDialog(evt, {}, parentPageID);
};

pageList.pickPage = function(evt, currentPageID, callback) {
	this.pagePicker.get().pickPage(evt, currentPageID, callback);
};

pageList.showPageDeleteDialog = function(evt, items) {
	if (items.length === undefined) items = [items];
	else if (items.length === 0) return;
	var labels = items.reduce(function(labels,item) {
		var label = item.label;
		return labels.length > 200 ? ', ...' : labels === '' ? label : labels + ', ' + label;
	}, '');
	var message = 'Do you really want to delete ' + labels + '?';
	ConfirmDialog.confirm(evt, message, this.deletePages.bind(this, items));
};

pageList.showCheckedPagesDeleteDialog = function(evt) {
	this.showPageDeleteDialog(evt, this.treeView.checked());
};

pageList.deletePages = function(items, evt) {
	for (var i = 0; i < items.length; i++) {
		this.pageService.deletePage(items[i].id, this.mediator.deleted);
	}
};

pageList.deletedPage = function(pageID) {
	this.load(this.currentPageID);
};

pageList.updatedPage = function(page) {
	this.load(this.currentPageID);
};

pageList.requestMove = function(pages, pageIndex) {
	var pageID = pages[pageIndex].id;
	if (pageIndex < pages.length - 1) {
		console.log('move before ' + pages[pageIndex + 1].id);
		this.pageService.movePageBefore(pageID, pages[pageIndex + 1].id, this.mediator.moved);
	} else {
		console.log('move as last of ' + this.currentPageID);
		this.pageService.movePageAsLast(pageID, this.currentPageID, this.mediator.moved);
	}
};

pageList.movedPage = function(pageID, destContextPageID, mode) {
	
};

function CmsxPagePicker(pageService, resourcePicker) {
	utils.bindAll(this);
	this.tree = new CmsxPageList(pageService, resourcePicker, 'cmsx-vgrid-content');
	this.dialog = new Dialog('cmsx-vgrid cmsx-page-picker').prefSize(600, 700)
		.add(this.tree)
		.add(new CmsxContainer('div', 'cmsx-vgrid-footer cmsx-align-center')
			.add(new CmsxButton('select', this.pagePicked)));
	this.destroy = this.dialog.destroy;
}

var pagePicker = CmsxPagePicker.prototype;

pagePicker.pickPage = function(evt, currentValue, callback) {
	this.tree.currentPageID = currentValue || null;
	this._callback = callback;
	this.tree.load(this.tree.currentPageID);
	this.dialog.show(evt);
};

pagePicker.pagePicked = function(evt) {
	this.dialog.hide(evt);
	var callback = this._callback;
	this._callback = null;
	callback(evt, this.tree.currentPageID);
};


function CmsxPagePreferences(pageService, resourcePicker, mediator) {
	utils.bindAll(this);
	this.mediator = mediator;
	this.pageService = pageService;
	this.form = new Form()
		.addInitialInput('id', 'ID')
		.addInput('title', 'Title')
		.addInput('renderer', 'Renderer')
		.addPickableInput('src', 'Content', 'text', resourcePicker)
		.addInput('stylesheet', 'XSLT stylesheet')
		.addButton('save', true, this.savePage);
	this.dialog = new Dialog('cmsx-page-prefs').add(this.form);
	this.destroy = this.dialog.destroy;
}

var pagePreferences = CmsxPagePreferences.prototype;

pagePreferences.editPage = function(evt, page, createBelowParent) {
	this.form.set(this.toPageProps(page));
	this.dialog.show(evt);
	this.createBelowParent = createBelowParent;
};

pagePreferences.savePage = function(evt, form) {
	if (typeof this.createBelowParent === 'string') {
		this.pageService.createPage(this.form.get(), this.createBelowParent, this.savedPage);
		this.createBelowParent = null;
	} else {
		this.pageService.updatePage(this.form.get(), this.savedPage);
	}
};

pagePreferences.savedPage = function(page) {
	this.dialog.hide();
	mediator.publish('cmsx.page.updated', page);
};

pagePreferences.toPageProps = function(page) {
	var props = {};
	for (var k in page) {
		if (page.hasOwnProperty(k) && typeof page[k] === 'string') {
			props[k] = page[k];
		}
	}
	return props;
};


CmsxPageList.PagePicker = CmsxPagePicker;
CmsxPageList.PagePreferences = CmsxPagePreferences;
module.exports = CmsxPageList;