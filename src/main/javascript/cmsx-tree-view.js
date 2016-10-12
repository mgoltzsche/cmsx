var log = require('./logger.js')('CmsxTreeView');
var React = require('react');
var ReactDOM = require('react-dom');
var ListView = React.createFactory(require('./cmsx-list-view.js'));

module.exports = React.createClass({
	getDefaultProps: function() {
		return {
			className: '',
			parents: [],
			contents: [],
			onSelectParent: function(item) {},
			onSelectContent: function(item) {}
		};
	},
	getInitialState: function() {
		return {
			parents: [],
			contents: []
		};
	},
	componentDidMount: function() {
		this.state.parents = this.props.parents;
		this.state.contents = this.props.contents;
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.parents !== this.props.parents) {
			this.setParents(parents);
		}
		if (nextProps.contents !== this.props.contents) {
			this.setContents(contents);
		}
	},
	setParents: function(parents) {
		this.state.parents = parents;
		this.refs.parents.setItems(parents);
	},
	setContents: function(contents) {
		this.state.contents = contents;
		this.refs.contents.setItems(contents);
	},
	select: function(item) {
		this.refs.contents.select(item);
	},
	render: function() {
		return React.DOM.div({className: 'cmsx-tree ' + this.props.className},
			ListView({
				ref: 'parents',
				className: 'cmsx-tree-parents',
				items: this.state.parents,
				onSelect: this.props.onSelectParent
			}),
			ListView({
				ref: 'contents',
				className: 'cmsx-tree-contents',
				items: this.state.contents,
				onSelect: this.props.onSelectContent
			}));
	}
});