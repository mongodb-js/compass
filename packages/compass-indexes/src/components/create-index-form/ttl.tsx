import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type TTL = {
  isTtl: boolean;
  toggleIsTtl: (isTtl: boolean) => any;
  ttl?: string;
  changeTtl: (ttl: string) => any;
};

const TTLCollapsibleFieldSet = ({
  isTtl,
  toggleIsTtl,
  ttl,
  changeTtl,
}: TTL) => {
  return (
    <div data-testid="create-index-modal-is-ttl">
      <CollapsibleFieldSet
        toggled={isTtl}
        onToggle={(checked: boolean) => toggleIsTtl(checked)}
        label="Create TTL"
        dataTestId="create-index-modal-is-ttl-checkbox"
        description="TTL indexes are special single-field indexes that MongoDB can use to automatically remove documents from a collection after a certain amount of time or at a specific clock time."
      >
        <TextInput
          value={ttl}
          label="seconds"
          data-testid="create-index-modal-is-ttl-input"
          type="number"
          onChange={(e) => changeTtl(e.target.value)}
          spellCheck={false}
        />
      </CollapsibleFieldSet>
    </div>
  );
};

export default TTLCollapsibleFieldSet;
