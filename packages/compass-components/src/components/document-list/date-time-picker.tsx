import React, { useCallback, useRef, useState } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Icon } from '../leafygreen';
import { useDarkMode } from '../../hooks/use-theme';
import {
  convertFromPickerDateTime,
  convertToPickerDateTime,
} from '../../utils/format-date';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const buttonStyles = css({
  display: 'flex',
  alignItems: 'center',
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'none',
  color: 'inherit',
  cursor: 'pointer',
});

// We are not showing the native input at all. This is mainly due to how its
// rendered in Safari. For Chrome/Firefox, we can hide the input and only show
// the picker icon, but that's not possible in Safari. So we hide everything
// and use our custom button to open the picker.
const dateTimePickerInput = css({
  colorScheme: 'light',
  width: 0,
  padding: 0,
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  '&::-webkit-calendar-picker-indicator': {
    display: 'none',
  },
});

const dateTimePickerInputDarkMode = css({
  // This is the only bit we can customize in the native picker popup.
  colorScheme: 'dark',
});

export function DateTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange(newValue: string): void;
}) {
  const pickerInputRef = useRef<HTMLInputElement>(null);
  const darkMode = useDarkMode();

  const pickerDateTime = convertToPickerDateTime(value);

  // On Firefox, when we clear the input value using `Clear` option from the
  // picker, the input value is set to empty string. And then on following
  // change in value, input.onChange is not called. So just before opening
  // the picker, if the (datetime) value is empty, we set the this value to
  // current date time so that the picker change is picked up.
  const [seededDateTime, setSeededDateTime] = useState<string | null>(null);

  const openPicker = useCallback(() => {
    const input = pickerInputRef.current;
    if (!input) {
      return;
    }

    if (!pickerDateTime) {
      setSeededDateTime(convertToPickerDateTime(new Date().toString()));
    }
    input.focus();
    input.showPicker();
  }, [pickerDateTime]);

  return (
    <span className={containerStyles}>
      <button
        type="button"
        aria-label="Select date and time"
        data-testid="hadron-document-date-picker-button"
        // The picker is only reachable by clicking its button, so that tabbing
        // keeps moving between the editors.
        tabIndex={-1}
        className={buttonStyles}
        onClick={openPicker}
      >
        <Icon glyph="Calendar" size="small" />
      </button>

      <input
        ref={pickerInputRef}
        type="datetime-local"
        // Milliseconds precision, matching BSON dates. On chromium, this is the
        // way to show milliseconds in the picker panel. On Firefox and Safari,
        // time picker UI is not available at all.
        step="0.001"
        data-testid="hadron-document-date-picker"
        value={pickerDateTime || seededDateTime || ''}
        tabIndex={-1}
        onBlur={() => {
          setSeededDateTime(null);
        }}
        onChange={(evt) => {
          setSeededDateTime(null);
          onChange(convertFromPickerDateTime(evt.currentTarget.value));
        }}
        className={cx(
          dateTimePickerInput,
          darkMode && dateTimePickerInputDarkMode
        )}
      ></input>
    </span>
  );
}
