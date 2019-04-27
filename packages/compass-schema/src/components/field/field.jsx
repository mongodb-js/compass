import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Type from 'components/type';
import Minichart from 'components/minichart';
import detectCoordinates from 'detect-coordinates';
import _ from 'lodash';

// const debug = require('debug')('mongodb-compass:schema:field');

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
    name: PropTypes.string,
    path: PropTypes.string,
    types: PropTypes.array,
    fields: PropTypes.array
  }

  constructor(props) {
    super(props);
    this.state = {
      // whether the nested fields are collapsed (true) or expanded (false)
      collapsed: true,
      // a reference to the active type object (only null initially)
      activeType: null
    };
  }

  componentWillMount() {
    // sort the types in descending order and push undefined to the end
    const types = _.sortBy(this.props.types, (type) => {
      if (type.name === 'Undefined') {
        return -Infinity;
      }
      return type.probability;
    }).reverse();

    // sets the active type to the first type in the props.types array
    this.setState({
      types: types,
      activeType: types.length > 0 ? types[0] : null
    });
  }

  /**
   * returns the field list (an array of <Field /> components) for nested
   * subdocuments.
   *
   * @return {component}  Field list or empty div
   */
  getChildren() {
    const fields = _.get(this.getNestedDocType(), 'fields', []);
    let fieldList;

    if (this.state.collapsed) {
      // return empty div if field is collapsed
      fieldList = [];
    } else {
      fieldList = fields.map((field) => {
        return <Field key={field.name} {...field} />;
      });
    }
    return (
      <div className="schema-field-list">
        {fieldList}
      </div>
    );
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
    const docType = _.find(this.props.types, 'name', 'Document');
    if (docType) {
      return docType;
    }
    // otherwise check for nested documents inside an array
    const arrType = _.find(this.props.types, 'name', 'Array');
    if (arrType) {
      return _.find(arrType.types, 'name', 'Document');
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
    if (global.hadronApp.isFeatureEnabled('enableMaps') && process.env.HADRON_ISOLATED !== 'true') {
      const coords = detectCoordinates(type);
      if (coords) {
        type.name = 'Coordinates';
        type.values = coords;
      }
    }
    return type;
  }

  /**
   * onclick handler to toggle collapsed/expanded state. This will hide/show
   * the nested fields and turn the disclosure triangle sideways.
   */
  titleClicked() {
    this.setState({collapsed: !this.state.collapsed});
  }

  /**
   * callback passed down to each type to be called when the type is
   * clicked. Will change the state of the Field component to track the
   * active type.
   *
   * @param {Object} type   object of the clicked type
   */
  renderType(type) {
    this.setState({activeType: type});
  }

  /**
   * Render a single field;
   *
   * @returns {React.Component} A react component for a single field
   */
  render() {
    // top-level class of this component
    const cls = FIELD_CLASS + ' ' + (this.state.collapsed ? 'collapsed' : 'expanded');

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
            <div className="schema-field-name" onClick={this.titleClicked.bind(this)}>
              <span className={nestedDocType ? 'caret' : ''}></span>
              <span>{this.props.name}</span>
            </div>
            <div className="schema-field-type-list">
              {typeList}
            </div>
          </div>
          <div className="col-sm-7 col-sm-offset-1">
            <Minichart
              fieldName={this.props.path}
              type={activeType}
              nestedDocType={nestedDocType}
            />
          </div>
        </div>
        {this.getChildren()}
      </div>
    );
  }
}

export default Field;
