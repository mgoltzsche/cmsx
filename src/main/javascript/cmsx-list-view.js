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
			onSelect: function(item) {}
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
	select: function(item) {
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
			this.props.onSelect(item);
		} catch(e) {
			log.error('CmsxListView.onSelect listener threw error', e);
		}
	},
	render: function() {
		var className = 'cmsx-list' + (this.props.className ? ' ' + this.props.className : '');
		return React.DOM.ul({className: className}, this.state.items.map(function(item) {
			return CmsxListItem({
				item: item,
				onSelect: this.select,
				key: item.id,
				ref: item.id
			});
		}.bind(this)));
	}
});

var CmsxListItem = React.createFactory(React.createClass({
	updateSelection: function(selected) {
		if (this.refs.view) { // Can be undefined when item changed
			this.refs.view.className = 'cmsx-list-item ' + (selected ? 'cmsx-list-item-selected' : '');
		}
	},
	handleItemClick: function(e) {
		e.preventDefault();
		this.props.onSelect(this.props.item);
	},
	render: function() {
		var item = this.props.item;
		var title = item.description || '';
		return React.DOM.li({
				ref: 'view',
				className: 'cmsx-list-item'
			},
			React.DOM.a({
				title: title,
				onClick: this.handleItemClick,
				className: 'cmsx-item-label'
			}, item.label));
	}
}));