import { runTranspiler } from '../../modules/run-transpiler';
import { copySuccessChanged } from '../../modules/copy-success';
import { errorChanged } from '../../modules/error';
import { outputLangChanged } from '../../modules/output-lang';
import { modalOpenChanged } from '../../modules/modal-open';
import { showImportsChanged } from '../../modules/show-imports';
import { buildersChanged } from '../../modules/builders';
import { driverChanged } from '../../modules/driver';
import ExportModal from '../export-modal';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class ExportToLanguage extends PureComponent {
  static displayName = 'ExportToLanguageComponent';
  static propTypes = {
    copySuccess: PropTypes.string,
    copyToClipboard: PropTypes.func,
    builders: PropTypes.bool.isRequired,
    driver: PropTypes.bool.isRequired,
    imports: PropTypes.string.isRequired,
    showImports: PropTypes.bool.isRequired,
    inputExpression: PropTypes.object.isRequired,
    transpiledExpression: PropTypes.string.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    mode: PropTypes.string.isRequired,
    outputLang: PropTypes.string.isRequired,
    error: PropTypes.string,
    uri: PropTypes.string.isRequired,
    showImportsChanged: PropTypes.func.isRequired,
    buildersChanged: PropTypes.func.isRequired,
    driverChanged: PropTypes.func.isRequired,
    outputLangChanged: PropTypes.func.isRequired,
    errorChanged: PropTypes.func.isRequired,
    modalOpenChanged: PropTypes.func.isRequired,
    copySuccessChanged: PropTypes.func.isRequired,
    runTranspiler: PropTypes.func.isRequired,
  };

  /**
   * Render ExportToLanguage component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div data-testid="export-to-language">
        <ExportModal {...this.props} />
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
const mapStateToProps = (state) => ({
  builders: state.builders,
  copySuccess: state.copySuccess,
  copyToClipboard: state.copyToClipboard,
  driver: state.driver,
  imports: state.imports,
  showImports: state.showImports,
  inputExpression: state.inputExpression,
  transpiledExpression: state.transpiledExpression,
  modalOpen: state.modalOpen,
  mode: state.mode,
  outputLang: state.outputLang,
  error: state.error,
  uri: state.uri,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedExportToLanguage = connect(mapStateToProps, {
  showImportsChanged,
  buildersChanged,
  driverChanged,
  outputLangChanged,
  errorChanged,
  modalOpenChanged,
  copySuccessChanged,
  runTranspiler,
})(ExportToLanguage);

export default MappedExportToLanguage;
