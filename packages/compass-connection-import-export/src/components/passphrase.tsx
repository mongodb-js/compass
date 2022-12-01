import React, { useCallback } from 'react';
import { css, Icon, spacing, TextInput } from '@mongodb-js/compass-components';

const passphraseInputStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

type PassphraseProps = {
  label: string;
  value: string;
  description: string;
  required: boolean;
  accepted?: boolean;
  disabled: boolean;
  onChange: (passphrase: string) => void;
};

export function Passphrase({
  label,
  description,
  required,
  value,
  accepted,
  disabled,
  onChange,
}: PassphraseProps): React.ReactElement {
  const onChangePassphrase = useCallback(
    ({
      target: { value: passphrase },
    }: React.ChangeEvent<HTMLInputElement>) => {
      onChange(passphrase);
    },
    [onChange]
  );

  const displayLabel = (
    <span className={passphraseInputStyles}>
      {label} {accepted && <Icon glyph="CheckmarkWithCircle" />}
    </span>
  );

  return (
    <TextInput
      description={description}
      disabled={disabled || accepted}
      onChange={onChangePassphrase}
      label={displayLabel as unknown as string}
      type="password"
      data-testid="conn-import-export-passphrase-input"
      value={value}
      errorMessage={required && !value ? 'Passphrase required' : undefined}
      state={required && !value ? 'error' : undefined}
      optional={!required}
    />
  );
}
