import React, { Component } from 'react';
import {
  css,
  withTheme,
  Label,
  spacing,
  Accordion,
} from '@mongodb-js/compass-components';

import CreateIndexFields from '../create-index-fields';
import { hasColumnstoreIndexesSupport } from '../../utils/has-columnstore-indexes-support';
import UniqueIndexCheckbox from './unique-index';
import TTLCollapsibleFieldSet from './ttl';
import PartialFilterCollapsibleFieldSet from './partial-filter-expression';
import CustomCollationCollapsibleFieldSet from './custom-collation';
import WildcardProjectionCollapsibleFieldSet from './wildcard-projection';
import ColumnstoreProjectionCollapsibleFieldSet from './columnstore-projection';
import IndexNameCollapsibleFieldSet from './index-name';

const createIndexModalFieldsStyles = css({
  margin: `${spacing[4]}px 0 ${spacing[5]}px 0`,
});

const createIndexModalOptionStyles = css({
  paddingLeft: spacing[1] + 2,
});

type IndexField = { name: string; type: string };

export type CreateIndexProps = {
  darkMode?: boolean;
  error?: string;
  inProgress: boolean;
  fields: IndexField[];
  schemaFields: string[];
  isVisible: boolean;
  isUnique: boolean;
  isTtl: boolean;
  ttl?: string;
  hasWildcardProjection: boolean;
  hasColumnstoreProjection: boolean;
  wildcardProjection: string;
  columnstoreProjection: string;
  isPartialFilterExpression: boolean;
  partialFilterExpression?: string;
  isCustomCollation: boolean;
  collationString?: string;
  hasIndexName: boolean;
  name: string;
  namespace: string;
  serverVersion: string;
  newIndexField?: string;
  // TODO: Refactor modules to get rid of return any.
  collationStringChanged: (collationString: string) => any;
  updateFieldName: (idx: number, name: string) => any;
  updateFieldType: (idx: number, fType: string) => any;
  addField: () => any;
  removeField: (idx: number) => any;
  toggleIsUnique: (isUnique: boolean) => any;
  toggleIsVisible: (isVisible: boolean) => any;
  toggleIsTtl: (isTtl: boolean) => any;
  toggleHasWildcardProjection: (hasWildcardProjection: boolean) => any;
  toggleHasColumnstoreProjection: (hasColumnstoreProjection: boolean) => any;
  toggleIsPartialFilterExpression: (isPartialFilterExpression: boolean) => any;
  toggleIsCustomCollation: (isCustomCollation: boolean) => any;
  toggleHasIndexName: (hasIndexName: boolean) => any;
  resetForm: () => any;
  createIndex: () => any;
  openLink: (href: string) => any;
  changeTtl: (ttl: string) => any;
  columnstoreProjectionChanged: (columnstoreProjection: string) => any;
  wildcardProjectionChanged: (wildcardProjection: string) => any;
  changePartialFilterExpression: (partialFilterExpression: string) => any;
  changeName: (name: string) => any;
  createNewIndexField: (newField: string) => any;
  clearError: () => any;
};

/**
 * Component for the create index form.
 */
class CreateIndexForm extends Component<CreateIndexProps> {
  static displayName = 'CreateIndexModal';

  /**
   * Create React components for each selected field in the create index form.
   *
   * @returns {Array} The React components for each field, or null if none are selected.
   */
  renderIndexFields() {
    if (!this.props.fields.length) {
      return null;
    }

    return (
      <CreateIndexFields
        schemaFields={this.props.schemaFields}
        fields={this.props.fields}
        serverVersion={this.props.serverVersion}
        isRemovable={!(this.props.fields.length > 1)}
        updateFieldName={this.props.updateFieldName}
        updateFieldType={this.props.updateFieldType}
        addField={this.props.addField}
        removeField={this.props.removeField}
        newIndexField={this.props.newIndexField}
        createNewIndexField={this.props.createNewIndexField}
      />
    );
  }

  /**
   * Create React components for create index options.
   *
   * @returns {Component}
   */
  renderIndexOptions() {
    return (
      <div
        data-test-id="create-index-modal-options"
        className={createIndexModalOptionStyles}
      >
        <UniqueIndexCheckbox
          isUnique={this.props.isUnique}
          toggleIsUnique={this.props.toggleIsUnique}
        />
        <IndexNameCollapsibleFieldSet
          hasIndexName={this.props.hasIndexName}
          toggleHasIndexName={this.props.toggleHasIndexName}
          indexName={this.props.name}
          changeName={this.props.changeName}
        />
        <TTLCollapsibleFieldSet
          isTtl={this.props.isTtl}
          toggleIsTtl={this.props.toggleIsTtl}
          ttl={this.props.ttl}
          changeTtl={this.props.changeTtl}
        />
        <PartialFilterCollapsibleFieldSet
          isPartialFilterExpression={this.props.isPartialFilterExpression}
          toggleIsPartialFilterExpression={
            this.props.toggleIsPartialFilterExpression
          }
          partialFilterExpression={this.props.partialFilterExpression}
          changePartialFilterExpression={
            this.props.changePartialFilterExpression
          }
        />
        <CustomCollationCollapsibleFieldSet
          isCustomCollation={this.props.isCustomCollation}
          toggleIsCustomCollation={this.props.toggleIsCustomCollation}
          collationString={this.props.collationString}
          collationStringChanged={this.props.changePartialFilterExpression}
        />
        <WildcardProjectionCollapsibleFieldSet
          hasWildcardProjection={this.props.hasWildcardProjection}
          toggleHasWildcardProjection={this.props.toggleHasWildcardProjection}
          wildcardProjection={this.props.wildcardProjection}
          wildcardProjectionChanged={this.props.wildcardProjectionChanged}
        />
        {hasColumnstoreIndexesSupport(this.props.serverVersion) && (
          <ColumnstoreProjectionCollapsibleFieldSet
            hasColumnstoreProjection={this.props.hasColumnstoreProjection}
            toggleHasColumnstoreProjection={
              this.props.toggleHasColumnstoreProjection
            }
            columnstoreProjection={this.props.columnstoreProjection}
            columnstoreProjectionChanged={
              this.props.columnstoreProjectionChanged
            }
          />
        )}
      </div>
    );
  }

  /**
   * Render the create index modal.
   *
   * @returns {React.Component} The create index modal.
   */
  render() {
    return (
      <>
        <div
          className={createIndexModalFieldsStyles}
          data-testid="create-index-form"
        >
          <Label htmlFor="create-index-modal-field-0">Index fields</Label>
          {this.renderIndexFields()}
        </div>
        <Accordion
          data-testid="create-index-modal-toggle-options"
          text="Options"
        >
          {this.renderIndexOptions()}
        </Accordion>
      </>
    );
  }
}

export default withTheme(CreateIndexForm);
