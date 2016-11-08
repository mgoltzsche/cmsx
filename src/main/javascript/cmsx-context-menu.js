var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = React.createFactory(require('./cmsx-dialog.js'));
var ListView = React.createFactory(require('./cmsx-list-view.js'));

module.exports = React.createClass({
	getInitialState: function() {
		return {
			message: 'Context menu',
			context: null,
			options: []
		};
	},
	render: function() {
		return Dialog({
			ref: 'dialog',
			className: 'cmsx-context-menu'
		}, this.state.message, ListView({
			items: this.state.options.map(this.toViewModel),
			onSelect: this.onSelectOption
		}));
	},
	show: function(message, context, options) {
		this.setState({
			message: message || 'Context menu',
			context: context,
			options: options
		});
		this.refs.dialog.show();
	},
	onSelectOption: function(item) {
		this.refs.dialog.hide();
		item.option.callback(this.state.context, item.option);
	},
	toViewModel: function(option) {
		return {
			id: option.id || option.label,
			label: option.label || option.id,
			option: option
		};
	}
});