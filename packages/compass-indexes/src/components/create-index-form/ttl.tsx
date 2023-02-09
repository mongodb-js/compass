import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type TTL = {
  useTtl: boolean;
  toggleUseTtl: (useTtl: boolean) => void;
  ttl?: string;
  ttlChanged: (ttl: string) => void;
};

const TTLCollapsibleFieldSet = ({
  useTtl,
  toggleUseTtl,
  ttl,
  ttlChanged,
}: TTL) => {
  return (
    <CollapsibleFieldSet
      toggled={useTtl}
      onToggle={toggleUseTtl}
      label="Create TTL"
      data-testid="create-index-modal-use-ttl"
      description="TTL indexes are special single-field indexes that MongoDB can use to automatically remove documents from a collection after a certain amount of time or at a specific clock time."
    >
      <TextInput
        value={ttl}
        label="seconds"
        data-testid="create-index-modal-use-ttl-input"
        type="number"
        onChange={(e) => ttlChanged(e.target.value)}
        spellCheck={false}
      />
    </CollapsibleFieldSet>
  );
};

export default TTLCollapsibleFieldSet;
