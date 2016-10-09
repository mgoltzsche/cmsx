var React = require('react');
var ReactDOM = require('react-dom');

var CmsxPagePreferences = React.createClass({
	getDefaultProps: function() {
		return {
			className: '',
			page: {
				id: '',
				title: '',
				renderer: ''
			},
			onSave: function(page) {}
		};
	},
	getInitialState: function() {
		return {
			pristine: true,
			page: {
				id: '',
				title: '',
				renderer: ''
			}
		};
	},
	componentDidMount: function() {
		this.state.page = this.props.page;
		this.applyValues(this.state.page);
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (nextProps.page !== this.props.page) {
			nextState.page = nextProps.page;
			nextState.pristine = true;
			this.applyValues(nextState.page);
		}
	},
	setPage: function(page) {
		console.log('setPage')
		this.setState({
			pristine: true,
			page: page
		});
		this.applyValues(page);
	},
	applyValues: function(page) {
		var input = this.refs.form.elements;
		input['id'].value = page.id || '';
		input['title'].value = page.title || '';
		input['renderer'].value = page.renderer || '';
	},
	handleChange: function(evt) {
		console.log('handle change ' + evt.target.name);
		this.state.page[evt.target.name] = evt.target.value;
		this.setState({
			pristine: false,
			page: this.state.page
		});
	},
	handleSave: function(evt) {
		evt.preventDefault();
		console.log(this.state.page);
		this.props.onSave(this.state.page);
	},
	render: function() {
		var className = 'cmsx-page-preferences ' + this.props.className + (this.state.pristine ? ' pristine' : ' dirty');
		return <form ref="form" className={className}>
			<div className="page-identity">
				<div>
					ID: <input name="id" type="text" onChange={this.handleChange} />
				</div>
				<div>
					Title: <input name="title" type="text" onChange={this.handleChange} />
				</div>
				<div>
					Renderer: <input name="renderer" type="text" onChange={this.handleChange} />
				</div>
				<button onClick={this.handleSave}>save</button>
			</div>
		</form>;
	}
});

module.exports = CmsxPagePreferences;