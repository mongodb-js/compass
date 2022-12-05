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
    const title = isExpanded ? 'Collapse' : 'Expand';

    return (
      <IconButton
        onClick={this.props.toggleInputDocumentsCollapsed}
        title={title}
        aria-label={title}
      ><Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'} size="small" /></IconButton>
    );
  }
}

export default InputCollapser;
