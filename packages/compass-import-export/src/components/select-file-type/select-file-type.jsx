import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, ControlLabel } from 'react-bootstrap';

import classnames from 'classnames';
import FILE_TYPES from '../../constants/file-types';

import styles from './select-file-type.module.less';
import createStyler from '../../utils/styler.js';
const style = createStyler(styles, 'select-file-type');

class SelectFileType extends PureComponent {
  static propTypes = {
    fileType: PropTypes.string,
    onSelected: PropTypes.func,
    label: PropTypes.string
  };
  render() {
    const { fileType, onSelected, label } = this.props;
    return (
      <FormGroup>
        <ControlLabel>{label}</ControlLabel>
        <div className={style()}>
          <Button
            data-test-id="select-file-type-json"
            aria-selected={fileType === FILE_TYPES.JSON}
            className={classnames({
              [style('selected')]: fileType === FILE_TYPES.JSON
            })}
            onClick={onSelected.bind(this, FILE_TYPES.JSON)}
          >
            JSON
          </Button>
          <Button
            data-test-id="select-file-type-csv"
            aria-selected={fileType === FILE_TYPES.CSV}
            className={classnames({
              [style('selected')]: fileType === FILE_TYPES.CSV
            })}
            onClick={onSelected.bind(this, FILE_TYPES.CSV)}
          >
            CSV
          </Button>
        </div>
      </FormGroup>
    );
  }
}

export default SelectFileType;
