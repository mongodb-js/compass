import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Subtitle,
  IconButton,
  Icon,
  css,
  uiColors,
  spacing,
} from '@mongodb-js/compass-components';
import sortBy from 'lodash.sortby';
import get from 'lodash.get';
import find from 'lodash.find';

import Type from '../type';
import Minichart from '../minichart';
import detectCoordinates from '../../modules/detect-coordinates';

const expandCollapseFieldSchemaStyles = css({
  color: uiColors.gray.dark2,
  minWidth: 0,
  // marginRight: spacing[1],
  marginLeft: -spacing[3],
});

const fieldNameStyles = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/**
 * The full schema component class.
 */
const FIELD_CLASS = 'schema-field';

/**
 * Component for the entire document list.
 */
class Field extends Component {
  static displayName = 'FieldComponent';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    name: PropTypes.string,
    path: PropTypes.string,
    types: PropTypes.array,
    fields: PropTypes.array,
  };

  constructor(props) {
    super(props);

    // Sort the types in descending order and push undefined to the end.
    const types = sortBy(props.types, (type) => {
      if (type.name === 'Undefined') {
        return -Infinity;
      }
      return type.probability;
    }).reverse();

    this.state = {
      // Whether the nested fields are collapsed (true) or expanded (false).
      collapsed: true,
      // Set the active type to the first type in the props.types array.
      types: types,
      activeType: types.length > 0 ? types[0] : null,
    };
  }

  /**
   * returns the field list (an array of <Field /> components) for nested
   * subdocuments.
   *
   * @return {component}  Field list or empty div
   */
  getChildren() {
    const fields = get(this.getNestedDocType(), 'fields', []);
    let fieldList;

    if (this.state.collapsed) {
      // return empty div if field is collapsed
      fieldList = [];
    } else {
      fieldList = fields.map((field) => {
        return (
          <Field
            key={field.name}
            actions={this.props.actions}
            localAppRegistry={this.props.localAppRegistry}
            {...field}
          />
        );
      });
    }
    return <div className="schema-field-list">{fieldList}</div>;
  }

  /**
   * returns Document type object of a nested document, either directly nested
   * or sub-documents inside an array.
   *
   * @return {Object}   object representation of `Document` type.
   *
   * @example
   * {foo: {bar: 1}} ==> {bar: 1} is a direct descendant
   * {foo: [{baz: 2}]} ==> {baz: 2} is a nested document inside an array
   *
   * @see mongodb-js/mongodb-schema
   */
  getNestedDocType() {
    // check for directly nested document first
    const docType = find(this.props.types, { name: 'Document' });
    if (docType) {
      return docType;
    }
    // otherwise check for nested documents inside an array
    const arrType = find(this.props.types, { name: 'Array' });
    if (arrType) {
      return find(arrType.types, { name: 'Document' });
    }
    return null;
  }

  /**
   * tests type for semantic interpretations, like geo coordinates, and
   * replaces type information like name and values if there's a match.
   *
   * @param  {Object} type   The original type
   * @return {Object}        The possibly modified type
   */
  getSemanticType(type) {
    // check if the type represents geo coordinates, if privacy settings allow
    if (global.hadronApp.isFeatureEnabled('enableMaps')) {
      const coords = detectCoordinates(type);
      if (coords) {
        type.name = 'Coordinates';
        type.values = coords;
      }
    }
    return type;
  }

  /**
   * onClick handler to toggle collapsed/expanded state. This will hide/show
   * the nested fields and turn the disclosure triangle sideways.
   */
  onToggleCollapseClicked() {
    this.setState({ collapsed: !this.state.collapsed });
  }

  /**
   * callback passed down to each type to be called when the type is
   * clicked. Will change the state of the Field component to track the
   * active type.
   *
   * @param {Object} type   object of the clicked type
   */
  renderType(type) {
    this.setState({ activeType: type });
  }

  /**
   * Render a single field;
   *
   * @returns {React.Component} A react component for a single field
   */
  render() {
    // top-level class of this component
    const cls =
      FIELD_CLASS + ' ' + (this.state.collapsed ? 'collapsed' : 'expanded');

    // types represented as horizontal bars with labels
    const typeList = this.state.types.map((type) => {
      // allow for semantic types and convert the type, e.g. geo coordinates
      type = this.getSemanticType(type);
      return (
        <Type
          key={'type-' + type.name}
          activeType={this.state.activeType}
          renderType={this.renderType.bind(this)}
          self={type}
          showSubTypes
          {...type}
        />
      );
    });

    const activeType = this.state.activeType;
    const nestedDocType = this.getNestedDocType();

    // children fields in case of nested array / document
    return (
      <div className={cls}>
        <div className="row">
          <div className="col-sm-4">
            <div className="schema-field-name">
              {nestedDocType && (
                <>
                  <IconButton
                    className={expandCollapseFieldSchemaStyles}
                    aria-label={
                      this.state.collapsed
                        ? 'Expand Document Schema'
                        : 'Collapse Document Schema'
                    }
                    onClick={this.onToggleCollapseClicked.bind(this)}
                  >
                    <Icon
                      glyph={this.state.collapsed ? 'CaretRight' : 'CaretDown'}
                    />
                  </IconButton>
                  &nbsp;
                </>
              )}
              <Subtitle className={fieldNameStyles}>{this.props.name}</Subtitle>
            </div>

            <div className="schema-field-type-list">{typeList}</div>
          </div>
          <div className="col-sm-7 col-sm-offset-1">
            <Minichart
              fieldName={this.props.path}
              type={activeType}
              nestedDocType={nestedDocType}
              actions={this.props.actions}
              localAppRegistry={this.props.localAppRegistry}
            />
          </div>
        </div>
        {this.getChildren()}
      </div>
    );
  }
}

export default Field;
