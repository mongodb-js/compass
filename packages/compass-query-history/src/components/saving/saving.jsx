import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Card, CardHeader, CardBody } from '../card';
import Query from '../query';

import styles from './saving.module.less';

class Saving extends PureComponent {
  static displayName = 'QueryHistorySaving';

  static propTypes = {
    model: PropTypes.object,
    actions: PropTypes.object.isRequired,
    className: PropTypes.string,
  };

  static defaultProps = {
    model: null,
  };

  constructor(props) {
    super(props);
    this._name = props.model ? props.model._lastExecuted.toString() : null;
  }

  cancel = () => {
    this.props.actions.cancelSave();
  };

  handleChange = (event) => {
    this._name = event.target.value;
  };

  handleSubmit = () => {
    const { actions, model } = this.props;
    actions.saveFavorite(model, this._name);
  };

  handleFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.handleSubmit();
  };

  renderSaveForm = () => {
    return (
      <form
        data-testid="query-history-saving-form"
        className={classnames(styles.form)}
        onSubmit={this.handleFormSubmit}
      >
        <input
          data-testid="query-history-saving-form-input-name"
          type="text"
          className={classnames(styles['form-input'])}
          placeholder="Favorite Name"
          onChange={this.handleChange}
        />
      </form>
    );
  };

  render() {
    const { model, className } = this.props;

    if (model === null) {
      return null;
    }

    const attributes = this.props.model.serialize();

    Object.keys(attributes)
      .filter((key) => key.charAt(0) === '_')
      .forEach((key) => delete attributes[key]);

    return (
      <Card className={className} data-testid="query-history-saving">
        <CardHeader
          title={this.renderSaveForm()}
          data-testid="query-history-saving-header"
          actionsVisible
        >
          <button
            data-testid="query-history-saving-form-button-save"
            className={classnames(
              'btn',
              'btn-sm',
              'btn-primary',
              styles.button
            )}
            onClick={this.handleSubmit}
          >
            Save
          </button>

          <button
            data-testid="query-history-saving-form-button-cancel"
            className={classnames(
              'btn',
              'btn-sm',
              'btn-default',
              styles.button
            )}
            onClick={this.cancel}
          >
            Cancel
          </button>
        </CardHeader>

        <CardBody>
          <Query
            data-testid="query-history-saving-query"
            attributes={attributes}
          />
        </CardBody>
      </Card>
    );
  }
}

export default Saving;
export { Saving };
