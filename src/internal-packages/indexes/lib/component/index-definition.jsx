const _ = require('lodash');
const React = require('react');

/**
 * Component for an index definition.
 */
class IndexDefinition extends React.Component {

  /**
   * Render the direction of the index field.
   *
   * @param {Object} field - The field.
   *
   * @returns {React.Component} The field component.
   */
  renderDirection(field) {
    if (field.value === 1) {
      return (
        <span className="sort">
          <i className="fa fa-arrow-circle-up fa-lg" />
        </span>
      );
    } else if (field.value === -1) {
      return (
        <span className="sort">
          <i className="fa fa-arrow-circle-down fa-lg" />
        </span>
      );
    }
    return (
      <span className="type">
        {field.value}
      </span>
    );
  }

  /**
   * Render a field in an index.
   *
   * @param {Object} field - The field.
   *
   * @returns {React.Component} The field component.
   */
  renderField(field) {
    return (
      <span key={field.field} className="pair">
        <span className="field">
          {field.field}
          {this.renderDirection(field)}
        </span>
      </span>
    );
  }

  /**
   * Render the index definition
   *
   * @returns {React.Component} The index definition.
   */
  render() {
    const fields = _.map(this.props.index.fields.serialize(), (field) => {
      return this.renderField(field);
    });
    return (
      <div className="index-definition">
        <div className="name">
          {this.props.index.name}
        </div>
        <div>
          <p className="definition">
            {fields}
          </p>
        </div>
      </div>
    );
  }
}

IndexDefinition.displayName = 'IndexDefinition';

IndexDefinition.propTypes = {
  index: React.PropTypes.object.isRequired
};

module.exports = IndexDefinition;
