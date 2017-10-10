import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Actions from 'actions';
import Section from 'components/section';

import styles from './license.less';
import { LicenseText } from 'models';

/**
 * The footer text.
 */
const FOOTER_TEXT = 'If You have any questions regarding this Agreement or the Software, ' +
  'please direct all correspondence to:';

/**
 * The license component.
 */
class License extends Component {
  static displayName = 'LicenseComponent';

  static propTypes = {
    isVisible: PropTypes.bool.isRequired
  };

  static defaultProps = {
    isVisible: false
  };

  /**
   * Agree to the license.
   */
  agree() {
    Actions.agree();
  }

  /**
   * Disagree with the license.
   */
  disagree() {
    Actions.disagree();
  }

  /**
   * Get the root class names.
   *
   * @return {Object} - The root class names.
   */
  rootClassNames() {
    const classes = {};
    classes[styles.modal] = true;
    classes[styles['modal-is-visible']] = this.props.isVisible;
    return classes;
  }

  /**
   * Render the license sections.
   *
   * @returns {React.Component} The component.
   */
  renderSections() {
    return LicenseText.sections.map((section, i) => {
      return (<Section key={i} text={section.text} title={section.title} index={i} />);
    });
  }

  /**
   * Render License component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(this.rootClassNames())}>
        <div className={classnames(styles.license)}>
          <div className={classnames(styles['license-content'])}>
            <div className={classnames(styles['license-header'])}>
              <h4 className={classnames(styles['license-header-title'])}>
                {LicenseText.title}
              </h4>
            </div>
            <div className={classnames(styles['license-body'])}>
              <p>{LicenseText.intro}</p>
              {this.renderSections()}
            </div>
            <div className={classnames(styles['license-footer'])}>
              <p>
                {FOOTER_TEXT}
                <a href="mailto:legal@mongodb.com">legal@mongodb.com</a>.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-default"
                onClick={this.agree.bind(this)}>Agree</button>
              <button
                type="button"
                className="btn btn-default"
                onClick={this.disagree.bind(this)}>Disagree</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default License;
export { License };
