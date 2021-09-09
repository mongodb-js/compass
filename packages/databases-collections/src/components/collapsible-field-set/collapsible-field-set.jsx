import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@leafygreen-ui/checkbox';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';

import FieldSet from '../field-set/field-set';
import styles from './collapsible-field-set.module.less';

function CollapsibleFieldSet({
  children,
  description,
  disabled,
  helpUrl,
  label,
  onToggle,
  openLink,
  toggled
}) {
  return (
    <FieldSet>
      <Checkbox
        onChange={event => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={label}
        checked={toggled}
        bold={false}
      />
      {!description ? '' : description}
      {!!helpUrl && !!openLink && (
        <IconButton
          className={styles['info-btn']}
          aria-label="Time-series collections documentation"
          onClick={() => {
            openLink(helpUrl);
          }}
        >
          <Icon
            glyph="InfoWithCircle"
            size="small"
          />
        </IconButton>
      )}
      {!toggled ? '' : children}
    </FieldSet>
  );
}

CollapsibleFieldSet.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string
  ]),
  disabled: PropTypes.bool,
  helpUrl: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  toggled: PropTypes.bool,
  openLink: PropTypes.func
};

export default CollapsibleFieldSet;
