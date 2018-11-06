import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import ValidationEditor from 'components/validation-editor';

import styles from './compass-json-schema-validation.less';

import { validationRulesChanged } from 'modules/validation';
import { namespaceChanged } from 'modules/namespace';

/**
 * The core schema validation component.
 */
class CompassJsonSchemaValidation extends Component {
  static displayName = 'CompassJsonSchemaValidation';

  render() {
    return (
      <div className={classnames(styles.root)}>
        <ValidationEditor {...this.props} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => {
  return {
    serverVersion: state.serverVersion,
    validation: state.validation,
    fields: state.fields,
    namespace: state.namespace
  };
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCompassJsonSchemaValidation = connect(
  mapStateToProps,
  {
    validationRulesChanged,
    namespaceChanged
  },
)(CompassJsonSchemaValidation);

export default MappedCompassJsonSchemaValidation;
export {CompassJsonSchemaValidation};
