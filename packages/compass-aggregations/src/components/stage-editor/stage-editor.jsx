import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class StageEditor extends PureComponent {
  static displayName = 'StageEditorComponent';

  static propTypes = {
    stage: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    onStageChange: PropTypes.func.isRequired
  }

  render() {
    return (
      <div></div>
    );
  }
}

export default StageEditor;
export { StageEditor };
