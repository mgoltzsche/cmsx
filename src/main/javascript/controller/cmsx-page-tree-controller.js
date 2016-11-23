var utils = require('../cmsx-utils.js');
var ContextMenu = require('./views/cmsx-context-menu.js');
var TreeView = require('./views/cmsx-tree-view.js');
var Dialog = require('./views/cmsx-dialog.js');
var ConfirmDialog = require('./views/cmsx-confirm-dialog.js');
var Form = require('./views/cmsx-form.js');

function CmsxPageTreeController(parentElement, pageService) {
	utils.bindAll(this);
	this.init(parentElement, pageService);
}

var controller = CmsxPageTreeController.prototype;

controller.init = function(parentElement, pageService) {
	this.pageID = this.currentPageID();
	this.pageService = pageService;
	this._view = new TreeView(parentElement, new TreeView.Features()
		.itemClickable(this.loadPage)
		.itemOptions(this.showPageOptions)
		.itemCheckable()
		.toolbarButton('delete', this.confirmPagesDeletion, 'cmsx-contextual')
		.toolbarButton('create', this.createPage));
	this.pageOptions = [
   		{
   			label: 'edit',
   			callback: this.editPage
   		},
   		{
   			label: 'delete',
   			callback: this.deletePages
   		},
   		{
   			label: 'add',
   			callback: this.createPage
   		},
   		{
   			label: 'pick',
   			callback: this.pickPage
   		}
   	];
	this.loadPage();
};

controller.destroy = function() {
	if (this._confirmDialog) this._confirmDialog.destroy();
	this._view.destroy();
};

controller.currentPageID = function() {
	var id = window.location.href.match(/([^\/]+)\/index.html(\?|#|$)/)[1];
	return id === 'p' ? '' : id;
};

controller.loadPage = function(page) {
	if (typeof page === 'object') page = page.id;
	this.pageID = page === undefined ? this.pageID : page;
	this.pageService.loadPage(this.pageID, this.onPageLoaded);
};

controller.onPageLoaded = function(page) {
	page.parents.push(page);
	treeView.setAncestors(page.parents.map(this.toPageViewModel));
	treeView.setChildren(page.children.map(this.toPageViewModel));
};

controller.toPageViewModel = function(page) {
	return {
		id: page.id || '',
		label: page.title || page.id,
		page: page
	};
};

controller.showPageOptions = function(item, evt) {
	ContextMenu.show(this.pageOptions, item.page, evt);
};

controller.confirmPagesDeletion = function(evt) {
	this.confirmPageDeletion(treeView.checked(), evt);
};

controller.confirmPageDeletion = function(items, evt) {
	if (items.length === undefined) items = [items];
	else if (items.length === 0) return;
	if (items.length > 0) {
		var labels = items.reduce(function(labels,item) {
			if (labels.length > 200) {
				return labels;
			}

			var allLabels = labels = labels === '' ? item.label : labels + ', ' + item.label;
			return allLabels.length > 200 ? allLabels + ', ...' : labels;
		}, '');
		var message = 'Do you really want to delete ' + labels + '?';
		this._confirmDialog = ConfirmDialog.confirm(message, this.deletePages.bind(this, items));
	}
};

controller.deletePages = function(pages) {
	console.log('TODO: delete pages ' + pages);
};

controller.pickPage = function(setter, currentValue) {
	if (!this._pagePicker) {
		this._pagePickerDialog = Dialog.create({preferredWidth: 500, preferredHeight: 500});
		var pageID = this.currentPageID();
		this._pagePicker = this.createPageTreeView(this._pagePickerDialog.contentElement());
	}

	this._pagePicker.load(currentValue || null);
	this._pagePickerDialog.show();
};

controller.createPage = function(evt) {
	var parentID = this.pageID;
	this.editPage({}, evt); // TODO: handle parent
};

// Page preferences form
controller.editPage = function(page, evt) {
	if (!this._pagePreferencesForm) {
		this._pagePreferencesDialog = Dialog.create();
		this._pagePreferencesForm = new Form()
			.addInitialInput('id', 'ID')
			.addInput('title', 'Title')
			.addInput('renderer', 'Renderer')
			.addPickableInput('src', 'Content', 'text', this.resourcePicker)
			.addInput('stylesheet', 'XSLT stylesheet')
			.addButton('save', true, this.savePage);
		this._pagePreferencesForm.dialog = this._pagePreferencesDialog;
		this._pagePreferencesForm.init(this._pagePreferencesDialog.contentElement());
	}

	this._pagePreferencesForm.set(this.toPageProps(page));
	this._pagePreferencesDialog.show(evt);
};

controller.savePage = function(form, evt) {
	var page = form.get();
	console.log(page);
	this.pageService.updatePage(page, this.onPageSaved.bind(this, form, page));
};

controller.onPageSaved = function(form, page) {
	form.dialog.hide();
};

controller.toPageProps = function(page) {
	var props = {};
	for (var k in page) {
		if (page.hasOwnProperty(k) && typeof page[k] === 'string') {
			props[k] = page[k];
		}
	}
	return props;
};

module.exports = CmsxPageController;