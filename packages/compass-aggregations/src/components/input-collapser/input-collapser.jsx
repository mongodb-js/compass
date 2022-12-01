import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { IconButton, Icon } from '@mongodb-js/compass-components';

class InputCollapser extends PureComponent {
  static displayName = 'InputCollapserComponent';

  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired
  };

  render() {
    const { isExpanded } = this.props;

    return (
      <IconButton
        onClick={this.props.toggleInputDocumentsCollapsed}
        title={isExpanded ? 'Collapse' : 'Expand'}
      ><Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'} size="small" /></IconButton>
    );
  }
}

export default InputCollapser;
