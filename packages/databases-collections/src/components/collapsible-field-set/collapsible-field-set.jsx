import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Description, IconButton, Icon } from '@mongodb-js/compass-components';

import FieldSet from '../field-set/field-set';
import styles from './collapsible-field-set.module.less';

function CollapsibleFieldSet({
  children,
  description,
  disabled,
  helpUrl,
  label,
  dataTestId,
  onToggle,
  openLink,
  toggled
}) {
  return (
    <FieldSet dataTestId={dataTestId}>
      <Checkbox
        onChange={event => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={label}
        checked={toggled}
        bold
        id={dataTestId ? `toggle-${dataTestId}` : undefined}
      />
      {!description
        ? ''
        : (
          <Description
            className={styles.description}
          >
            {description}
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
          </Description>
        )
      }

      {!toggled ? '' : children}
    </FieldSet>
  );
}

CollapsibleFieldSet.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
  dataTestId: PropTypes.string,
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
