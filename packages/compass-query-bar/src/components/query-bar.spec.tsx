import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';

import {
  QueryOptionsGrid,
  getGridTemplateForQueryOptions,
} from './query-options-grid';
import { QueryBar } from './query-bar';

const renderQueryBar = (
  props: Partial<ComponentProps<typeof QueryBar>> = {}
) => {
  const defaultQueryOptions: QueryOption[] = [];

  render(
    <QueryBar
      // buttonLabel = 'Apply',
      // expanded: isQueryOptionsExpanded = false,
      // queryOptions = ['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'],
      // onApply: _onApply,
      // onChangeQueryOption,
      // onReset: _onReset,
      // queryState,
      // refreshEditorAction,
      // schemaFields,
      // serverVersion,
      // showQueryHistoryButton = true,
      // toggleExpandQueryOptions,
      // toggleQueryHistory: _toggleQueryHistory,
      // valid: isQueryValid,
      // ...queryOptionProps
      onRunExplain={() => {}}
      {...props}
    />
  );
};

describe('QueryBar Component', function () {
  describe('when rendered', function () {
    let onApplySpy: SinonSpy;
    let onResetSpy: SinonSpy;
    let toggleQueryHistorySpy: SinonSpy;
    let toggleExpandQueryOptionsSpy: SinonSpy;
    beforeEach(function () {
      onApplySpy = sinon.spy();
      onResetSpy = sinon.spy();
      toggleQueryHistorySpy = sinon.spy();
      toggleExpandQueryOptionsSpy = sinon.spy();
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        toggleQueryHistory: toggleQueryHistorySpy,
        toggleExpandQueryOptions: toggleExpandQueryOptionsSpy,
      });
    });

    it('renders the entire option grid', function () {
      const menu = screen.getByTestId('save-menu');
      expect(menu).to.exist;

      userEvent.click(menu);

      const menuContent = screen.getByTestId('save-menu-content');
      expect(within(menuContent).getByLabelText('Save')).to.exist;
      expect(within(menuContent).getByLabelText('Save as')).to.exist;
      expect(within(menuContent).getByLabelText('Create view')).to.exist;
    });
  });
});
