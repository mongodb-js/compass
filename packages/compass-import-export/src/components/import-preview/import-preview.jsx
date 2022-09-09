import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from './import-preview.module.less';

import createStyler from '../../utils/styler.js';
const style = createStyler(styles, 'import-preview');

import { createDebug } from '../../utils/logger';
const debug = createDebug('import-preview');

import SelectFieldType from '../select-field-type';

class PreviewRow extends PureComponent {
  static propTypes = {
    values: PropTypes.array,
    fields: PropTypes.array,
    index: PropTypes.number,
  };

  render() {
    const { values, index } = this.props;
    const cells = values.map((v, i) => {
      const header = this.props.fields[i];
      if (v === '') {
        v = <i>empty string</i>;
      }
      if (header && !header.checked) {
        return (
          <td key={i} className="unchecked">
            {v}
          </td>
        );
      }
      /**
       * TODO: lucas: Use highlight.js, mongodb-ace-mode, or something
       * so the text style of the value matches its destination type.
       * This is particular important for the user to be able to descern
       * numbers/booleans that are strings from csv are actually being
       * cast to those types the user expects.
       */
      return <td key={i}>{v}</td>;
    });

    return <tr>{[].concat(<td key="field-index">{index + 1}</td>, cells)}</tr>;
  }
}

class PreviewValues extends PureComponent {
  static propTypes = {
    values: PropTypes.array,
    fields: PropTypes.array,
  };

  render() {
    const { values } = this.props;
    return (
      <tbody>
        {values.map((val, i) => (
          <PreviewRow
            key={i}
            fields={this.props.fields}
            values={val}
            index={i}
          />
        ))}
      </tbody>
    );
  }
}

class PreviewFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.array,
    onCheckedChanged: PropTypes.func.isRequired,
    setFieldType: PropTypes.func.isRequired,
  };

  onCheckedChanged(path, evt) {
    debug('Checked changed', path, evt.currentTarget.checked);
    this.props.onCheckedChanged(path, evt.currentTarget.checked);
  }

  render() {
    const fields = this.props.fields.map((field) => {
      return (
        <th key={field.path} data-testid={`preview-field-header-${field.path}`}>
          <div>
            <input
              type="checkbox"
              checked={field.checked}
              title={
                field.checked
                  ? `${field.path} values will be imported`
                  : `Values for ${field.path} will be ignored`
              }
              onChange={this.onCheckedChanged.bind(this, field.path)}
            />
            <ul>
              <li>{field.path}</li>
              <li>
                <SelectFieldType
                  selectedType={field.type}
                  onChange={this.props.setFieldType.bind(this, field.path)}
                />
              </li>
            </ul>
          </div>
        </th>
      );
    });
    return (
      <thead>
        <tr>{[].concat(<th key="field-index" />, fields)}</tr>
      </thead>
    );
  }
}

class ImportPreview extends PureComponent {
  static propTypes = {
    fields: PropTypes.array,
    values: PropTypes.array,
    onFieldCheckedChanged: PropTypes.func.isRequired,
    setFieldType: PropTypes.func.isRequired,
    loaded: PropTypes.bool,
  };

  render() {
    const { loaded, fields, values } = this.props;

    if (!loaded) {
      debug('Preview unavailable: not loaded yet');
      return null;
    }

    if (!Array.isArray(fields) || !Array.isArray(values)) {
      debug('Preview unavailable: Fields or values is not an array', {
        fields,
        values,
      });
      return null;
    }

    return (
      <div className={style()}>
        <div className={style('header')}>Specify Fields and Types</div>
        <table>
          <PreviewFields
            fields={this.props.fields}
            onCheckedChanged={this.props.onFieldCheckedChanged}
            setFieldType={this.props.setFieldType}
          />
          <PreviewValues
            fields={this.props.fields}
            values={this.props.values}
          />
        </table>
      </div>
    );
  }
}

export default ImportPreview;
