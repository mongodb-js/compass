import React from 'react';
import { connect } from 'react-redux';

import { toggleIsVisible } from '../../modules/is-visible';
import { nameChanged } from '../../modules/drop-index/name';
import { changeConfirmName } from '../../modules/drop-index/confirm-name';
import { handleError, clearError } from '../../modules/error';
import { dropIndex } from '../../modules/drop-index';
import { resetForm } from '../../modules/reset-form';

import DropIndexForm from '../drop-index-form';
import type { DropIndexFormProps } from '../drop-index-form';
import type { RootState } from '../../modules/drop-index';

/**
 * Drop index modal.
 */
function DropIndexModal(props: DropIndexFormProps) {
  return <DropIndexForm {...props} />;
}

const mapState = ({
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
}: RootState) => ({
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
});

const mapDispatch = {
  toggleIsVisible,
  clearError,
  handleError,
  nameChanged,
  changeConfirmName,
  dropIndex,
  resetForm,
};

export default connect(mapState, mapDispatch)(DropIndexModal);
