var log = require('./logger.js')('CmsxButtons');
var React = require('react');
var ReactDOM = require('react-dom');

module.exports = React.createClass({
	getDefaultProps: function() {
		return {
			className: '',
			context: null,
			actions: []
		};
	},
	getInitialState: function() {
		return {
			collapsed: true
		};
	},
	render: function() {
		var buttons = this.props.actions.map(function(action) {
			return CmsxButton({
				key: action.label,
				action: action,
				context: this.props.context
			});
		}.bind(this));

		return React.DOM.div({
			className: 'cmsx-buttons ' + (this.state.collapsed ? 'cmsx-collapsed ' : '') + this.props.className,
			onClick: this.toggleCollapse
		}, React.DOM.ul({}, buttons));
	},
	toggleCollapse: function() {
		var collapse = !this.state.collapsed;
		this.setState({collapsed: collapse});

		if (!collapse) {
			document.addEventListener('click', this.collapse);
		}
	},
	collapse: function() {
		this.setState({collapsed: true});
		document.removeEventListener('click', this.collapse);
	}
});

var CmsxButton = React.createFactory(React.createClass({
	render: function() {
		return React.DOM.li({
			key: this.props.action.label
		}, React.DOM.a({
			className: 'cmsx-button',
			onClick: this.handleClick
		}, React.DOM.span({className: 'cmsx-button-label'}, this.props.action.label)));
	},
	handleClick: function(e) {
		e.preventDefault();
		this.props.action.callback(this.props.context, this.props.action);
	}
}));