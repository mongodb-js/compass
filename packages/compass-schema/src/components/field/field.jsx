import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Subtitle,
  Icon,
  css,
  cx,
  palette,
  spacing,
  KeylineCard,
} from '@mongodb-js/compass-components';
import sortBy from 'lodash.sortby';
import get from 'lodash.get';
import find from 'lodash.find';

import Type from '../type';
import Minichart from '../minichart';
import detectCoordinates from '../../modules/detect-coordinates';
import { withPreferences } from 'compass-preferences-model';

const toggleCollapseButtonIconStyles = css({
  color: palette.gray.dark2,
});

const fieldNameStyles = css({
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const expandCollapseFieldButtonStyles = css({
  display: 'flex',
  marginLeft: -spacing[3],
  alignItems: 'center',
  border: 'none',
  background: 'none',
  borderRadius: '6px',
  boxShadow: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'box-shadow 150ms ease-in-out',
  '&:hover': {
    cursor: 'pointer',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${palette.blue.light1}`,
  },
});

const fieldContainerStyles = css({
  marginBottom: spacing[2],
});

const fieldStyles = css({
  paddingTop: spacing[4],
  marginBottom: spacing[2],
});

const fieldListContainerStyles = css({
  position: 'relative',
});

const fieldTypeListStyles = css({
  // borderRadius: '1px'
  paddingTop: spacing[1],
});

const fieldNameContainerStyles = css({
  position: 'relative',
});

const fieldRowStyles = css({
  marginBottom: spacing[4],
  padding: `0px ${spacing[3]}px`,
  display: 'grid',

  gridTemplateAreas: '"description chart"',
  gridTemplateColumns: '1fr 2fr',
  columnGap: spacing[6],
  position: 'relative',
  alignItems: 'center',
});

const fieldDescriptionStyles = css({
  gridArea: 'description',
});

const fieldChartContainerStyles = css({
  gridArea: 'chart',
});

const nestedFieldStyles = css({
  margin: spacing[2],
});

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
    enableMaps: PropTypes.boolean,
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

    if (this.props.enableMaps) {
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

    const fieldAccordionButtonId = `$$${this.props.path}.${this.props.name}-button`;
    const fieldListRegionId = `$$${this.props.path}.${this.props.name}-fields-region`;

    // children fields in case of nested array / document
    return (
      <KeylineCard className={fieldContainerStyles}>
        <div className={fieldStyles} data-testid="schema-field">
          <div className={fieldRowStyles}>
            {/* width 33% */}
            <div
              // className="col-sm-4"
              className={fieldDescriptionStyles}
            >
              {/* <div className="schema-field-name"> */}
              <div
                className={fieldNameContainerStyles}
                data-testid="schema-field-name"
              >
                {nestedDocType ? (
                  <button
                    className={expandCollapseFieldButtonStyles}
                    id={fieldAccordionButtonId}
                    type="button"
                    aria-label={
                      this.state.collapsed
                        ? 'Expand Document Schema'
                        : 'Collapse Document Schema'
                    }
                    aria-expanded={this.state.collapsed ? 'false' : 'true'}
                    aria-controls={fieldListRegionId}
                    onClick={this.onToggleCollapseClicked.bind(this)}
                  >
                    <Icon
                      className={toggleCollapseButtonIconStyles}
                      glyph={this.state.collapsed ? 'CaretRight' : 'CaretDown'}
                    />
                    &nbsp;
                    <Subtitle className={fieldNameStyles}>
                      {this.props.name}
                    </Subtitle>
                  </button>
                ) : (
                  <Subtitle className={fieldNameStyles}>
                    {this.props.name}
                  </Subtitle>
                )}
              </div>
              <div
                className={cx('schema-field-type-list', fieldTypeListStyles)}
                data-testid="schema-field-type-list"
              >
                {typeList}
              </div>
            </div>
            {/* width: 58.33333333%; */}
            {/* margin-left: 8.33333333%; */}
            <div
              // className="col-sm-7 col-sm-offset-1"
              className={fieldChartContainerStyles}
            >
              <Minichart
                fieldName={this.props.path}
                type={activeType}
                nestedDocType={nestedDocType}
                actions={this.props.actions}
                localAppRegistry={this.props.localAppRegistry}
              />
            </div>
          </div>

          {!this.state.collapsed && (
            <div
              className={cx('schema-field-list', fieldListContainerStyles)}
              data-testid="schema-field-list"
              id={fieldListRegionId}
              role="region"
              aria-labelledby={fieldAccordionButtonId}
            >
              {get(this.getNestedDocType(), 'fields', []).map((field) => (
                <div className={nestedFieldStyles} key={field.name}>
                  <Field
                    actions={this.props.actions}
                    localAppRegistry={this.props.localAppRegistry}
                    enableMaps={this.props.enableMaps}
                    {...field}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </KeylineCard>
    );
  }
}

export default withPreferences(Field, ['enableMaps'], React);
