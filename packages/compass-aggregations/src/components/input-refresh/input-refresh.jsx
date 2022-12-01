import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { IconButton, Icon, css } from '@mongodb-js/compass-components';

const iconButtonStyles = css({
  flexGrow: 0
});

class InputRefresh extends PureComponent {
  static displayName = 'InputRefreshComponent';

  static propTypes = {
    refreshInputDocuments: PropTypes.func.isRequired
  }

  render() {
    const title = 'Refresh Documents';

    return (
      <IconButton
        onClick={this.refreshInputDocuments}
        title={title}
        aria-label={title}
        className={iconButtonStyles}
      ><Icon glyph="Refresh" size="small" /></IconButton>
    );
  }
}

export default InputRefresh;
