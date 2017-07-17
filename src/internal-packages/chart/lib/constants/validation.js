/**
 * A list of validation states used to inform the user of the current state of
 * their input fields within this chart builder.
 *
 * Inspired by react-bootstrap and the 'editState' of
 * compass-document-validation.
 */
const VALIDATION_STATES = Object.freeze({
  UNMODIFIED: null,
  MODIFIED: 'warning',
  SUCCESS: 'success',
  ERROR: 'error'
});

module.exports = {
  VALIDATION_STATES
};
