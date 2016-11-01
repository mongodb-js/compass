const React = require('react');
const { FormControl, FormGroup } = require('react-bootstrap');
const ValidationActions = require('../actions');

// const debug = require('debug')('mongodb-compass:validation:json-input');

class JSONInput extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      errorState: '',
      input: props.validatorDoc ?
        JSON.stringify(props.validatorDoc, null, 2) : '{}'
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      input: JSON.stringify(newProps.validatorDoc, null, 2)
    });
  }

  onInputChanged(evt) {
    this.setState({
      input: evt.target.value
    });
  }

  onBlur() {
    const doc = this.validate();
    if (doc) {
      ValidationActions.setValidatorDocument(doc);
    }
  }

  validate() {
    try {
      return JSON.parse(this.state.input);
    } catch (e) {
      this.setState({
        errorState: 'not valid JSON.'
      });
      return false;
    }
  }

  render() {
    return (
      <FormGroup>
        <FormControl
          componentClass="textarea"
          className="json-input json-input-textarea"
          value={this.state.input}
          onChange={this.onInputChanged.bind(this)}
          onBlur={this.onBlur.bind(this)}
        />
      </FormGroup>
    );
  }
}

JSONInput.propTypes = {
  validatorDoc: React.PropTypes.object.isRequired
};

JSONInput.displayName = 'JSONInput';

module.exports = JSONInput;
