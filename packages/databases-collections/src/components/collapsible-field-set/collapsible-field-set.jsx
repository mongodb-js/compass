import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Description, Label, Link } from '@mongodb-js/compass-components';
import { useId } from '@react-aria/utils';

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
  toggled
}) {
  const labelId = dataTestId ? `toggle-${dataTestId}` : useId();

  return (
    <FieldSet dataTestId={dataTestId}>
      <Checkbox
        onChange={event => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={(
          <>
            <Label htmlFor={labelId}>{label}</Label>
            {!description
              ? ''
              : (
                <Description
                  className={styles.description}
                >
                  {description}
                  {!!helpUrl && (
                    <Link
                      className={styles['info-link']}
                      href={helpUrl}
                      aria-label="Time-series collections documentation"
                    >
                      Learn More
                    </Link>
                  )}
                </Description>
              )
            }
          </>
        )}
        checked={toggled}
        bold
        id={labelId}
      />

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
  toggled: PropTypes.bool
};

export default CollapsibleFieldSet;
