import React from 'react';
import PropTypes from 'prop-types';
import type { InsertDocumentDialogProps } from './insert-document-dialog';

/**
 * BEM prefix.
 */
const PREFIX = 'document-footer';

/**
 * Message class constant.
 */
const MESSAGE_CLASS = `${PREFIX}-message`;

/**
 * Map of modes to styles.
 */
const MODES = {
  progress: 'is-in-progress',
  error: 'is-error',
  modifying: 'is-modifying',
};

export type InsertDocumentFooterProps = {
  mode: InsertDocumentDialogProps['mode'];
  message: string;
};

/**
 * Component for the insert document footer.
 *
 * @param {Object} props - The properties.
 *
 * @returns {Component} The component.
 */
const InsertDocumentFooter = (props: InsertDocumentFooterProps) => (
  <div className={`${PREFIX} ${PREFIX}-${MODES[props.mode]}`}>
    <div className={MESSAGE_CLASS} title={props.message}>
      {props.message}
    </div>
  </div>
);

InsertDocumentFooter.displayName = 'InsertDocumentFooter';

InsertDocumentFooter.propTypes = {
  message: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
};

export default InsertDocumentFooter;
