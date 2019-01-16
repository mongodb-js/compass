import React from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';

/**
 * Component for an index definition type.
 */
class IndexDefinitionType extends React.Component {

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
        {field.value._bsontype ? this.renderBsonValue(field.value) : field.value}
      </span>
    );
  }

  /**
   * Render the bson value.
   *
   * @param {Object} value - The value.
   */
  renderBsonValue(value) {
    if (value._bsontype === 'Decimal128') {
      return value.toString();
    } else if (value._bsontype === 'Int32') {
      return value.valueOf();
    } else if (value._bsontype === 'Long') {
      return value.toNumber();
    }
    return value;
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
    const fields = map(this.props.index.fields.serialize(), (field) => {
      return this.renderField(field);
    });
    return (
      <div className="index-definition-type">
        <p className="definition" data-test-id={this.props.dataTestId}>
          {fields}
        </p>
      </div>
    );
  }
}

IndexDefinitionType.displayName = 'IndexDefinitionType';

IndexDefinitionType.propTypes = {
  index: PropTypes.object.isRequired,
  dataTestId: PropTypes.string
};

export default IndexDefinitionType;
