/* eslint react/sort-comp:0 */
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { ModalStatusMessage, ModalCheckbox, ModalInput } from 'hadron-react-components';
import pluck from 'lodash.pluck';

import styles from './create-index-modal.module.less';

import CreateIndexField from '../create-index-field';

import { toggleInProgress } from '../../modules/in-progress';
import { toggleShowOptions } from '../../modules/create-index/show-options';
import {
  addField,
  removeField,
  updateFieldType,
  updateFieldName
} from '../../modules/create-index/fields';
import { changeName } from '../../modules/create-index/name';
import { changeSchemaFields } from '../../modules/create-index/schema-fields';
import { clearError, handleError } from '../../modules/error';
import { toggleIsVisible } from '../../modules/is-visible';
import { toggleIsBackground } from '../../modules/create-index/is-background';
import { toggleIsUnique } from '../../modules/create-index/is-unique';
import {
  toggleIsPartialFilterExpression
} from '../../modules/create-index/is-partial-filter-expression';
import { toggleIsTtl } from '../../modules/create-index/is-ttl';
import { changeTtl } from '../../modules/create-index/ttl';
import { toggleIsWildcard } from '../../modules/create-index/is-wildcard';
import {
  changeWildcardProjection
} from '../../modules/create-index/wildcard-projection';
import {
  changePartialFilterExpression
} from '../../modules/create-index/partial-filter-expression';
import {
  toggleIsCustomCollation
} from '../../modules/create-index/is-custom-collation';
import { changeCollationOption } from '../../modules/create-index/collation';
import { openLink } from '../../modules/link';
import { createIndex } from '../../modules/create-index';
import { resetForm } from '../../modules/reset-form';

import getIndexHelpLink from '../../utils/index-link-helper';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

/**
 * Component for the create index modal.
 */
class CreateIndexModal extends PureComponent {
  static displayName = 'CreateIndexModal';
  static propTypes = {
    showOptions: PropTypes.bool.isRequired,
    error: PropTypes.string,
    inProgress: PropTypes.bool.isRequired,
    schemaFields: PropTypes.array.isRequired,
    fields: PropTypes.array.isRequired,
    dataService: PropTypes.object,
    isVisible: PropTypes.bool.isRequired,
    isBackground: PropTypes.bool.isRequired,
    isUnique: PropTypes.bool.isRequired,
    isTtl: PropTypes.bool.isRequired,
    ttl: PropTypes.string.isRequired,
    isWildcard: PropTypes.bool.isRequired,
    wildcardProjection: PropTypes.string.isRequired,
    isPartialFilterExpression: PropTypes.bool.isRequired,
    partialFilterExpression: PropTypes.string.isRequired,
    isCustomCollation: PropTypes.bool.isRequired,
    collation: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    updateFieldName: PropTypes.func.isRequired,
    updateFieldType: PropTypes.func.isRequired,
    addField: PropTypes.func.isRequired,
    removeField: PropTypes.func.isRequired,
    toggleIsUnique: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    toggleShowOptions: PropTypes.func.isRequired,
    toggleIsBackground: PropTypes.func.isRequired,
    toggleIsTtl: PropTypes.func.isRequired,
    toggleIsWildcard: PropTypes.func.isRequired,
    toggleIsPartialFilterExpression: PropTypes.func.isRequired,
    toggleIsCustomCollation: PropTypes.func.isRequired,
    resetForm: PropTypes.func.isRequired,
    createIndex: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    changeTtl: PropTypes.func.isRequired,
    changeWildcardProjection: PropTypes.func.isRequired,
    changePartialFilterExpression: PropTypes.func.isRequired,
    changeCollationOption: PropTypes.func.isRequired,
    changeName: PropTypes.func.isRequired
  };

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.CollationSelect = global.hadronApp.appRegistry.getComponent(
      'Collation.Select'
    );
  }

  handleShow() {
    track('Screen', { name: 'create_index_modal' });
  }

  /**
   * Close modal and fire clear create index form action.
   */
  handleClose() {
    this.props.toggleIsVisible(false);
    this.props.resetForm();
  }

  /**
   * Fire trigger index creation action when create button is clicked and close modal.
   *
   * @param {Object} evt - The click event.
   */
  onFormSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.createIndex();
  }

  /**
   * Toggle showOptions state value when toggle bar is clicked.
   *
   * @param {Object} evt - The click event.
   */
  handleToggleBarClick(evt) {
    this.props.toggleShowOptions(!this.props.showOptions);
    evt.preventDefault();
    evt.stopPropagation();
  }

  /**
   * Fire add field action to add field and type to add index form.
   *
   * @param {Object} evt - The click event.
   */
  handleAddField(evt) {
    this.props.addField();
    evt.preventDefault();
    evt.stopPropagation();
  }

  /**
   * Create React components for each selected field in the create index form.
   *
   * @returns {Array} The React components for each field, or null if none are selected.
   */
  renderIndexFields() {
    if (!this.props.fields.length) {
      return null;
    }

    const disabledFields = pluck(this.props.fields, 'name');

    return this.props.fields.map((field, idx) => {
      return (
        <CreateIndexField
          fields={this.props.schemaFields}
          key={idx}
          idx={idx}
          field={field}
          disabledFields={disabledFields}
          isRemovable={!(this.props.fields.length > 1)}
          updateFieldName={this.props.updateFieldName}
          updateFieldType={this.props.updateFieldType}
          addField={this.props.addField}
          removeField={this.props.removeField} />
      );
    });
  }

  renderOptions() {
    if (!this.props.showOptions) {
      return null;
    }
    return (
      <div
        className={styles['create-index-modal-options']}
        data-test-id="create-index-modal-options"
      >
        <ModalCheckbox
          name="Build index in the background"
          data-test-id="toggle-is-background"
          titleClassName={styles['create-index-modal-options-checkbox']}
          checked={this.props.isBackground}
          helpUrl={getIndexHelpLink('BACKGROUND')}
          onClickHandler={() => (this.props.toggleIsBackground(!this.props.isBackground))}
          onLinkClickHandler={this.props.openLink} />
        <ModalCheckbox
          name="Create unique index"
          data-test-id="toggle-is-unique"
          titleClassName={styles['create-index-modal-options-checkbox']}
          checked={this.props.isUnique}
          helpUrl={getIndexHelpLink('UNIQUE')}
          onClickHandler={() => (this.props.toggleIsUnique(!this.props.isUnique))}
          onLinkClickHandler={this.props.openLink} />
        <ModalCheckbox
          name="Create TTL"
          data-test-id="toggle-is-ttl"
          titleClassName={styles['create-index-modal-options-param']}
          checked={this.props.isTtl}
          helpUrl={getIndexHelpLink('TTL')}
          onClickHandler={() => (this.props.toggleIsTtl(!this.props.isTtl))}
          onLinkClickHandler={this.props.openLink} />
        {this.renderTtl()}
        <ModalCheckbox
          name="Partial Filter Expression"
          data-test-id="toggle-is-pfe"
          titleClassName={styles['create-index-modal-options-param']}
          checked={this.props.isPartialFilterExpression}
          helpUrl={getIndexHelpLink('PARTIAL')}
          onClickHandler={() => (this.props.toggleIsPartialFilterExpression(!this.props.isPartialFilterExpression))}
          onLinkClickHandler={this.props.openLink} />
        {this.renderPartialFilterExpression()}
        <ModalCheckbox
          name="Use Custom Collation"
          data-test-id="toggle-is-custom-collation"
          titleClassName={styles['create-index-modal-options-param']}
          checked={this.props.isCustomCollation}
          helpUrl={getIndexHelpLink('COLLATION_REF')}
          onClickHandler={() => (this.props.toggleIsCustomCollation(!this.props.isCustomCollation))}
          onLinkClickHandler={this.props.openLink} />
        {this.renderCollation()}
        <ModalCheckbox
          name="Wildcard Projection"
          data-test-id="toggle-is-wildcard"
          titleClassName={styles['create-index-modal-options-param']}
          checked={this.props.isWildcard}
          helpUrl={getIndexHelpLink('WILDCARD')}
          onClickHandler={() => (this.props.toggleIsWildcard(!this.props.isWildcard))}
          onLinkClickHandler={this.props.openLink} />
        {this.renderWildcard()}
      </div>
    );
  }

  renderTtl() {
    if (this.props.showOptions && this.props.isTtl) {
      return (
        <div className={styles['create-index-modal-options-param-wrapper']}>
          <ModalInput
            id="ttl-value"
            name="seconds"
            value={this.props.ttl}
            onChangeHandler={(evt) => (this.props.changeTtl(evt.target.value))} />
        </div>
      );
    }
  }
  renderWildcard() {
    if (this.props.showOptions && this.props.isWildcard) {
      return (
        <div className={styles['create-index-modal-options-param-wrapper']}>
          <ModalInput
            id="wildcard-projection-value"
            name=""
            value={this.props.wildcardProjection}
            onChangeHandler={(evt) => (this.props.changeWildcardProjection(evt.target.value))} />
        </div>
      );
    }
  }
  renderPartialFilterExpression() {
    if (this.props.showOptions && this.props.isPartialFilterExpression) {
      return (
        <div className={styles['create-index-modal-options-param-wrapper']}>
          <ModalInput
            id="partial-filter-expression-value"
            name=""
            value={this.props.partialFilterExpression}
            onChangeHandler={(evt) => (this.props.changePartialFilterExpression(evt.target.value))} />
        </div>
      );
    }
  }

  /**
   * Render the collation component when collation is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCollation() {
    if (this.props.isCustomCollation) {
      return (
        <div className={styles['create-index-modal-options-param-wrapper']}>
          <this.CollationSelect
            collation={this.props.collation || {}}
            changeCollationOption={this.props.changeCollationOption}
          />
        </div>
      );
    }
  }

  /**
   * Render the create index modal.
   *
   * @returns {React.Component} The create index modal.
   */
  render() {
    return (
      <Modal
        // Because this modal is rendered outside of the
        // react root we need to apply the deprecated bootstrap styles here.
        className="with-global-bootstrap-styles"
        show={this.props.isVisible}
        backdrop="static"
        dialogClassName={styles['create-index-modal']}
        onShow={this.handleShow.bind(this)}
        onHide={this.handleClose.bind(this)}
      >
        <Modal.Header>
          <Modal.Title>Create Index</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form
            name="create-index-modal-form"
            onSubmit={this.onFormSubmit.bind(this)}
            data-test-id="create-index-modal">

            <ModalInput
              id="create-index-name"
              name="Choose an index name"
              value={this.props.name}
              onChangeHandler={(evt) => (this.props.changeName(evt.target.value))} />

            <div className={styles['create-index-modal-fields']}>
              <p className={styles['create-index-modal-fields-description']}>Configure the index definition</p>
              {this.renderIndexFields()}

              <button
                onClick={this.handleAddField.bind(this)}
                id="add-field"
                className="btn btn-primary btn-sm btn-full-width">
                Add another field
              </button>
            </div>

            <button
              className={styles['create-index-modal-toggle-bar']}
              onClick={this.handleToggleBarClick.bind(this)}
            >
              <div className={styles['create-index-modal-toggle-bar-header']}>
                {this.props.showOptions ?
                  <i className="fa fa-angle-down"/> :
                  <i className="fa fa-angle-right"/>}
                <p className={styles['create-index-modal-toggle-bar-header-text']}> Options</p>
              </div>
            </button>

            {this.renderOptions()}

            {!(this.props.error === null || this.props.error === undefined) ?
              <ModalStatusMessage
                icon="times"
                message={this.props.error}
                type="error"
                className={styles['create-index-modal-message']}/>
              : null}

            {this.props.inProgress && (this.props.error === null || this.props.error === undefined) ?
              <ModalStatusMessage
                icon="spinner"
                message="Create in Progress"
                type="in-progress"
                className={styles['create-index-modal-message']}/>
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="cancel-create-index-button"
            disabled={this.props.inProgress}
            text="Cancel"
            clickHandler={this.handleClose.bind(this)} />
          <TextButton
            className="btn btn-primary btn-sm"
            disabled={!this.props.fields.length || this.props.inProgress}
            dataTestId="create-index-button"
            text="Create Index"
            clickHandler={this.props.createIndex} />
        </Modal.Footer>
      </Modal>
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
  dataService: state.dataService,
  fields: state.fields,
  inProgress: state.inProgress,
  showOptions: state.showOptions,
  schemaFields: state.schemaFields,
  error: state.error,
  isVisible: state.isVisible,
  isBackground: state.isBackground,
  isTtl: state.isTtl,
  ttl: state.ttl,
  isWildcard: state.isWildcard,
  wildcardProjection: state.wildcardProjection,
  isUnique: state.isUnique,
  isPartialFilterExpression: state.isPartialFilterExpression,
  partialFilterExpression: state.partialFilterExpression,
  isCustomCollation: state.isCustomCollation,
  collation: state.collation,
  name: state.name
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateIndexModal = connect(
  mapStateToProps,
  {
    toggleInProgress,
    toggleShowOptions,
    changeSchemaFields,
    clearError,
    handleError,
    toggleIsVisible,
    toggleIsBackground,
    toggleIsTtl,
    toggleIsWildcard,
    toggleIsUnique,
    toggleIsPartialFilterExpression,
    toggleIsCustomCollation,
    changePartialFilterExpression,
    changeTtl,
    changeWildcardProjection,
    changeCollationOption,
    openLink,
    changeName,
    createIndex,
    resetForm,
    addField,
    removeField,
    updateFieldName,
    updateFieldType
  },
)(CreateIndexModal);

export default MappedCreateIndexModal;
export { CreateIndexModal };
