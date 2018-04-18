import { TextButton } from 'hadron-react-buttons';
import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select-plus';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-modal.less';

class ExportModal extends Component {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    copyQuery: PropTypes.func.isRequired,
    exportQuery: PropTypes.object.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  // store the current query in state before we pass it to reducer
  state = {
    queryInputValue: '',
    selectedLang: ''
  }

  queryInputEvent = (evt) => {
    this.setState({
      queryInputValue: evt.target.value
    });
  }

  // save state, and pass in the current selected lang
  handleSelect = (selectedLang) => {
    this.setState({ selectedLang });
    this.props.runQuery(selectedLang.value, this.state.queryInputValue);
  }

  copyHandler = (evt) => {
    evt.preventDefault();
    const input = document.getElementById('export-to-lang-output-return');
    console.log('input', input);
    this.props.copyQuery(input);
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const langOptions = [
      { value: 'java', label: 'Java' },
      { value: 'node', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python3', label: 'Python 3' }
    ];

    const copyButtonStyle = classnames({
      'btn': true,
      'btn-sm': true,
      'btn-primary': true,
      [ styles['export-to-lang-output-copy-btn'] ]: true
    });

    const selectedLang = this.state.selectedLang;
    const selectedValue = selectedLang && selectedLang.value;

    return (
      <Modal
        backdrop="static"
        bsSize="large"
        onHide={this.onExportModalToggle}
        dialogClassName="export-to-lang-modal">

        <Modal.Header>
          <Modal.Title>Export Query To Language</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form name="export-to-lang-form"
              data-test-id="export-to-lang">
            <div className="form-group">
              <p>My Query</p>
              <input
                autoFocus
                type="text"
                className="form-control"
                id="export-to-lang-query"
                name="Query"
                value={this.state.queryInputValue}
                onChange={this.queryInputEvent} />
            </div>
            <div>
              <p>Export Query To</p>
              <div className={classnames(styles['export-to-lang-output'])}>
                <Select
                  name="export-to-lang-output-select"
                  className={classnames(styles['export-to-lang-output-select'])}
                  searchable={false}
                  clearable={false}
                  placeholder="Java"
                  value={selectedValue}
                  onChange={this.handleSelect}
                  options={langOptions}/>
                <input
                  type="text"
                  className={classnames(styles['export-to-lang-output-return'])}
                  id="export-to-lang-output-return"
                  value={this.props.exportQuery.returnQuery}/>
                <TextButton
                  className={copyButtonStyle}
                  text="Copy"
                  clickHandler={this.copyHandler}/>
              </div>
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Close"
            clickHandler={this.closeClickHandler} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;
