var log = require('./logger.js')('CmsxListView');
var React = require('react');
var ReactDOM = require('react-dom');

/**
 * Displays a list of items.
 * Items must be an object with id, label, [description] properties.
 */
module.exports = React.createClass({
	getDefaultProps: function() {
		return {
			items: [],
			className: '',
			onSelect: function(item) {},
			onOptions: null
		};
	},
	getInitialState: function() {
		return {
			items: []
		};
	},
	componentDidMount: function() {
		this.state.items = this.props.items;
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.items !== this.props.items) {
			nextState.items = nextProps.items;
		}
	},
	setItems: function(items) {
		if (items !== this.state.items) {
			this.setState({items: items});
		}
	},
	select: function(item, evt) {
		item = typeof item === 'string' ? {id: item} : item;

		var itemView = this.refs[item.id];
		var lastItemView = this.state.selectedItemView;

		if (lastItemView) {
			lastItemView.updateSelection(false);
		}

		if (itemView) {
			itemView.updateSelection(true);
			this.state.selectedItemView = itemView;
		} else {
			log.error('CmsxListView.select: item ' + item.id + ' does not exist');
		}

		try {
			this.props.onSelect(item, evt);
		} catch(e) {
			log.error('CmsxListView.onSelect listener threw error', e);
		}
	},
	render: function() {
		var className = 'cmsx-list' + (this.props.className ? ' ' + this.props.className : '');
		var items = this.state.items.map(function(item) {
			return CmsxListItem({
				item: item,
				onSelect: this.select,
				onOptions: this.props.onOptions,
				key: item.id,
				ref: item.id
			});
		}.bind(this));

		return React.DOM.ul({className: className}, items);
	}
});

var CmsxListItem = React.createFactory(React.createClass({
	updateSelection: function(selected) {
		if (this.refs.view) { // Can be undefined when item changed
			this.refs.view.className = 'cmsx-list-item ' + (selected ? 'cmsx-list-item-selected' : '');
		}
	},
	handleItemClick: function(evt) {
		evt.preventDefault();
		this.props.onSelect(this.props.item, evt);
	},
	handleOptionsClick: function(evt) {
		evt.preventDefault();
		this.props.onOptions(this.props.item, evt);
	},
	render: function() {
		var item = this.props.item;
		var title = item.description || '';
		var buttons = this.props.onOptions ? React.DOM.a({
				className: 'cmsx-item-options',
				onClick: this.handleOptionsClick
			}) : null;

		return React.DOM.li({
				ref: 'view',
				className: 'cmsx-list-item'
			},
			React.DOM.a({
				title: title,
				onClick: this.handleItemClick,
				className: 'cmsx-item-label'
			}, item.label),
			buttons);
	}
}));