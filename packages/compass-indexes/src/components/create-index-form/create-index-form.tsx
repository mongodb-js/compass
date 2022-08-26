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
  fields: IndexField[];
  newIndexField?: string;
  schemaFields: string[];

  isUnique: boolean;

  useIndexName: boolean;
  useTtl: boolean;
  usePartialFilterExpression: boolean;
  useCustomCollation: boolean;
  useWildcardProjection: boolean;
  useColumnstoreProjection: boolean;

  name: string;
  ttl?: string;
  partialFilterExpression?: string;
  wildcardProjection: string;
  collationString?: string;
  columnstoreProjection: string;

  serverVersion: string;

  toggleIsUnique: (isUnique: boolean) => void;

  toggleUseIndexName: (useIndexName: boolean) => void;
  toggleUseTtl: (useTtl: boolean) => void;
  toggleUsePartialFilterExpression: (
    usePartialFilterExpression: boolean
  ) => void;
  toggleUseWildcardProjection: (useWildcardProjection: boolean) => void;
  toggleUseCustomCollation: (useCustomCollation: boolean) => void;
  toggleUseColumnstoreProjection: (useColumnstoreProjection: boolean) => void;

  nameChanged: (name: string) => void;
  ttlChanged: (ttl: string) => void;
  partialFilterExpressionChanged: (partialFilterExpression: string) => void;
  wildcardProjectionChanged: (wildcardProjection: string) => void;
  collationStringChanged: (collationString: string) => void;
  columnstoreProjectionChanged: (columnstoreProjection: string) => void;

  updateFieldName: (idx: number, name: string) => void;
  updateFieldType: (idx: number, fType: string) => void;
  addField: () => void; // Plus icon.
  removeField: (idx: number) => void; // Minus icon.
  createNewIndexField: (newField: string) => void; // Create a new index name.

  openLink: (href: string) => void;
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
        darkMode={this.props.darkMode}
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
          useIndexName={this.props.useIndexName}
          toggleUseIndexName={this.props.toggleUseIndexName}
          indexName={this.props.name}
          nameChanged={this.props.nameChanged}
        />
        <TTLCollapsibleFieldSet
          useTtl={this.props.useTtl}
          toggleUseTtl={this.props.toggleUseTtl}
          ttl={this.props.ttl}
          ttlChanged={this.props.ttlChanged}
        />
        <PartialFilterCollapsibleFieldSet
          usePartialFilterExpression={this.props.usePartialFilterExpression}
          toggleUsePartialFilterExpression={
            this.props.toggleUsePartialFilterExpression
          }
          partialFilterExpression={this.props.partialFilterExpression}
          partialFilterExpressionChanged={
            this.props.partialFilterExpressionChanged
          }
        />
        <WildcardProjectionCollapsibleFieldSet
          useWildcardProjection={this.props.useWildcardProjection}
          toggleUseWildcardProjection={this.props.toggleUseWildcardProjection}
          wildcardProjection={this.props.wildcardProjection}
          wildcardProjectionChanged={this.props.wildcardProjectionChanged}
        />
        <CustomCollationCollapsibleFieldSet
          useCustomCollation={this.props.useCustomCollation}
          toggleUseCustomCollation={this.props.toggleUseCustomCollation}
          collationString={this.props.collationString}
          collationStringChanged={this.props.collationStringChanged}
        />
        {hasColumnstoreIndexesSupport(this.props.serverVersion) && (
          <ColumnstoreProjectionCollapsibleFieldSet
            useColumnstoreProjection={this.props.useColumnstoreProjection}
            toggleUseColumnstoreProjection={
              this.props.toggleUseColumnstoreProjection
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
   * Render the create index form.
   *
   * @returns {React.Component} The create index form.
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
