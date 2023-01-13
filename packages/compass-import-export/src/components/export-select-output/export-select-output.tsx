import { SelectFileType } from '../select-file-type';
import toNS from 'mongodb-ns';
import ProgressBar from '../progress-bar';
import { FILETYPE } from '../../constants/export-step';
import styles from './export-select-output.module.less';
import React, { PureComponent } from 'react';
import createStyler from '../../utils/styler';
import PropTypes from 'prop-types';
import {
  STARTED,
  CANCELED,
  COMPLETED,
  FAILED,
  UNSPECIFIED,
  COMPLETED_WITH_ERRORS,
} from '../../constants/process-status';
import type { FileInputBackend } from '@mongodb-js/compass-components';
import {
  css,
  FileInput,
  createElectronFileInputBackend,
} from '@mongodb-js/compass-components';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
const { debug } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

const style = createStyler(styles, 'export-select-output');

const fileInputStyles = css({
  margin: '5px auto 20px',
});

/**
 * Progress messages.
 */
const MESSAGES = {
  [UNSPECIFIED]: '',
  [FAILED]: '',
  [COMPLETED_WITH_ERRORS]: '',
  [CANCELED]: 'Export canceled',
  [COMPLETED]: 'Export completed',
  [STARTED]: 'Exporting documents...',
};

type ExportSelectOutputProps = {
  count?: number | null;
  fileType: 'json' | 'csv';
  fileName?: string;
  ns: string;
  status: keyof typeof MESSAGES;
  exportedDocsCount?: number;
  progress: number;
  startExport: () => void;
  exportStep: string;
  cancelExport: () => void;
  selectExportFileType: (fileType: 'json' | 'csv') => void;
  selectExportFileName: (filePath: string) => void;
  isAggregation: boolean;
};

class ExportSelectOutput extends PureComponent<ExportSelectOutputProps> {
  static propTypes = {
    count: PropTypes.number,
    fileType: PropTypes.string,
    fileName: PropTypes.string,
    ns: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    exportedDocsCount: PropTypes.number,
    progress: PropTypes.number.isRequired,
    startExport: PropTypes.func.isRequired,
    exportStep: PropTypes.string.isRequired,
    cancelExport: PropTypes.func.isRequired,
    selectExportFileType: PropTypes.func.isRequired,
    selectExportFileName: PropTypes.func.isRequired,
    isAggregation: PropTypes.bool.isRequired,
  };

  fileInputBackend: FileInputBackend | undefined;

  constructor(props: ExportSelectOutputProps) {
    super(props);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
      const electron: typeof import('@electron/remote') = require('@electron/remote');
      this.fileInputBackend = createElectronFileInputBackend(
        electron,
        'save',
        () => ({
          title: `Select ${this.props.fileType} target file`,
          defaultPath:
            toNS(this.props.ns).collection + '.' + this.props.fileType,
          buttonLabel: 'Select',
        })
      );
    } catch (err) {
      // Happens in non-electron tests
      debug('could not create electron file input backend', err);
    }
  }

  /**
   * Stop form default submission to a whitescreen
   * and start the export if ready.
   * @param {Object} evt - DOM event
   */
  handleOnSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.props.fileName) {
      this.props.startExport();
    }
  };

  /**
   * Handle choosing a file from the file dialog.
   */
  handleChooseFile = (files: string[]) => {
    if (files.length > 0) {
      this.props.selectExportFileName(files[0]);
    }
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.props.exportStep !== FILETYPE) return null;

    const values = this.props.fileName ? [this.props.fileName] : undefined;

    return (
      <div>
        <form onSubmit={this.handleOnSubmit} className={style('form')}>
          <SelectFileType
            fileType={this.props.fileType}
            label="Export File Type"
            onSelected={this.props.selectExportFileType}
          />
          <FileInput
            label="Output"
            id="export-file"
            onChange={this.handleChooseFile}
            values={values}
            className={fileInputStyles}
            variant="VERTICAL"
            backend={this.fileInputBackend}
            accept={`.${this.props.fileType}`}
          />
        </form>
        <ProgressBar
          status={this.props.status}
          docsTotal={this.props.count}
          progress={this.props.progress}
          cancel={this.props.cancelExport}
          message={MESSAGES[this.props.status]}
          docsWritten={this.props.exportedDocsCount}
        />
      </div>
    );
  }
}
export default ExportSelectOutput;
