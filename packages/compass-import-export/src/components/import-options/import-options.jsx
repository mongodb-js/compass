import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { FileInput } from '@mongodb-js/compass-components';

import FILE_TYPES from '../../constants/file-types';
import SelectFileType from '../select-file-type';

import styles from './import-options.module.less';
import createStyler from '../../utils/styler.js';
const style = createStyler(styles, 'import-options');

class ImportOptions extends PureComponent {
  static propTypes = {
    delimiter: PropTypes.string,
    setDelimiter: PropTypes.func.isRequired,
    fileType: PropTypes.string,
    selectImportFileType: PropTypes.func.isRequired,
    fileName: PropTypes.string,
    selectImportFileName: PropTypes.func.isRequired,
    stopOnErrors: PropTypes.bool,
    setStopOnErrors: PropTypes.func,
    ignoreBlanks: PropTypes.bool,
    setIgnoreBlanks: PropTypes.func,
    fileOpenDialog: PropTypes.func
  };

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = (files) => {
    this.props.selectImportFileName(files[0]);
  };

  handleOnSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  render() {
    const isCSV = this.props.fileType === FILE_TYPES.CSV;

    const values = this.props.fileName ? [this.props.fileName] : undefined;

    return (
      <form onSubmit={this.handleOnSubmit} className={style('form')}>
        <FileInput
          label="Select File"
          id="import-file"
          onChange={this.handleChooseFile.bind(this)}
          values={values}
          variant="VERTICAL"
        />
        <SelectFileType
          fileType={this.props.fileType}
          onSelected={this.props.selectImportFileType}
          label="Select Input File Type"
        />
        <fieldset>
          <legend className={style('legend')}>Options</legend>
          {isCSV && (<React.Fragment>
            <div className={style('option')}>
              <label className={style('option-select-label')}>
                Select delimiter
                <select
                  id="import-delimiter-select"
                  onChange={(evt) => {
                    this.props.setDelimiter(evt.currentTarget.value);
                  }}
                  defaultValue={this.props.delimiter}
                  className={style('option-select')}>
                  <option value=",">comma</option>
                  <option value={'\t'}>tab</option>
                  <option value=";">semicolon</option>
                  <option value=" ">space</option>
                </select>
              </label>
            </div>
            <div className={style('option')}>
              <label className={style('option-checkbox-label')}>
                <input
                  type="checkbox"
                  checked={this.props.ignoreBlanks}
                  onChange={() => {
                    this.props.setIgnoreBlanks(!this.props.ignoreBlanks);
                  }}
                  className={style('option-checkbox')}
                />
                Ignore empty strings
              </label>
            </div>
          </React.Fragment>)}
          <div className={style('option')}>
            <label className={style('option-checkbox-label')}>
              <input
                type="checkbox"
                checked={this.props.stopOnErrors}
                onChange={() => {
                  this.props.setStopOnErrors(!this.props.stopOnErrors);
                }}
                className={style('option-checkbox')}
              />
              Stop on errors
            </label>
          </div>
        </fieldset>
      </form>
    );
  }
}

export default ImportOptions;
