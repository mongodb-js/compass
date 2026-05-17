import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { Provider } from '../../stores/context';
import { configureStore } from '../../stores/query-bar-store';
import type { QueryBarExtraArgs } from '../../stores/query-bar-store';
import {
  addFilterRule,
  addProjectionEntry,
  addSortEntry,
  applyVisualBuilder,
  changeField,
  clearVisualBuilder,
  toggleVisualBuilder,
  updateFilterRule,
} from '../../stores/query-bar-reducer';
import VisualQueryBuilderPanel from './visual-query-builder';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

describe('Visual Query Builder', function () {
  let preferences: PreferencesAccess;

  function makeStore() {
    return configureStore({}, {
      preferences,
      logger: createNoopLogger(),
      track: createNoopTrack(),
      connectionInfoRef: { current: { id: 'test', connectionOptions: {} } },
    } as unknown as QueryBarExtraArgs);
  }

  function renderPanel(onRunQuery: () => void = () => undefined) {
    const store = makeStore();
    store.dispatch(toggleVisualBuilder(true));
    const result = render(
      <PreferencesProvider value={preferences}>
        <Provider store={store}>
          <VisualQueryBuilderPanel onRunQuery={onRunQuery} />
        </Provider>
      </PreferencesProvider>
    );
    return { ...result, store };
  }

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(cleanup);

  describe('reducer flow', function () {
    it('writes a filter rule into fields.filter.string', function () {
      const store = makeStore();
      store.dispatch(addFilterRule({ path: 'age', bsonType: 'Number' }));
      const id = store.getState().queryBar.visualBuilder.rules[0].id;
      store.dispatch(
        updateFilterRule(id, { operator: '$gt', valueString: '18' })
      );
      expect(store.getState().queryBar.fields.filter.string).to.equal(
        '{age:{$gt:18}}'
      );
      expect(store.getState().queryBar.fields.filter.valid).to.equal(true);
    });

    it('writes a projection entry into fields.project.string', function () {
      const store = makeStore();
      store.dispatch(addProjectionEntry({ path: 'name' }));
      store.dispatch(addProjectionEntry({ path: 'email' }));
      expect(store.getState().queryBar.fields.project.string).to.equal(
        '{name:1,email:1}'
      );
    });

    it('writes a sort entry into fields.sort.string', function () {
      const store = makeStore();
      store.dispatch(addSortEntry({ path: 'createdAt' }));
      expect(store.getState().queryBar.fields.sort.string).to.equal(
        '{createdAt:1}'
      );
    });

    it('clearVisualBuilder empties all three slices', function () {
      const store = makeStore();
      store.dispatch(addFilterRule({ path: 'a', bsonType: 'String' }));
      store.dispatch(addProjectionEntry({ path: 'a' }));
      store.dispatch(addSortEntry({ path: 'a' }));
      store.dispatch(clearVisualBuilder());

      const vb = store.getState().queryBar.visualBuilder;
      expect(vb.rules).to.have.length(0);
      expect(vb.projection).to.have.length(0);
      expect(vb.sort).to.have.length(0);
      // serializers produce '' for empty slices, which becomes the field string.
      expect(store.getState().queryBar.fields.project.string).to.equal('');
      expect(store.getState().queryBar.fields.sort.string).to.equal('');
    });

    it('flips representable to false when filter is set to an unrepresentable shape', function () {
      const store = makeStore();
      store.dispatch(changeField('filter', "{$expr: {$eq: ['$a', '$b']}}"));
      expect(store.getState().queryBar.visualBuilder.representable).to.equal(
        false
      );
    });

    it('keeps representable true when filter is set via the builder itself', function () {
      const store = makeStore();
      store.dispatch(addFilterRule({ path: 'age', bsonType: 'Number' }));
      const id = store.getState().queryBar.visualBuilder.rules[0].id;
      store.dispatch(
        updateFilterRule(id, { operator: '$gt', valueString: '18' })
      );
      expect(store.getState().queryBar.visualBuilder.representable).to.equal(
        true
      );
    });

    it('applyVisualBuilder fires telemetry without dispatching applyQuery', function () {
      const store = makeStore();
      store.dispatch(
        addFilterRule({ path: 'age', bsonType: 'Number', valueString: '42' })
      );
      const before = store.getState().queryBar.applyId;
      store.dispatch(applyVisualBuilder());
      // The thunk is telemetry-only; the actual apply (and the host plugin's
      // refresh) is routed through the panel's onRunQuery prop instead.
      expect(store.getState().queryBar.applyId).to.equal(before);
    });
  });

  describe('rendered panel', function () {
    it('renders the three drop zones', function () {
      renderPanel();
      expect(screen.getByTestId('visual-query-builder-filter')).to.exist;
      expect(screen.getByTestId('visual-query-builder-projection')).to.exist;
      expect(screen.getByTestId('visual-query-builder-sort')).to.exist;
    });

    it('clicking Clear resets the slices', function () {
      const { store } = renderPanel();
      store.dispatch(addFilterRule({ path: 'a', bsonType: 'String' }));
      const clearBtn = screen
        .getAllByRole('button')
        .find((b) => /^Clear$/i.test(b.textContent ?? ''));
      expect(clearBtn).to.exist;
      userEvent.click(clearBtn!);
      expect(store.getState().queryBar.visualBuilder.rules).to.have.length(0);
    });

    it('shows the unrepresentable overlay when filter contains $expr', function () {
      const { store } = renderPanel();
      store.dispatch(changeField('filter', "{$expr: {$eq: ['$a', '$b']}}"));
      expect(screen.getByTestId('visual-query-builder-unrepresentable')).to
        .exist;
    });

    it('lets the user remove a rule', async function () {
      const { store } = renderPanel();
      store.dispatch(addFilterRule({ path: 'age', bsonType: 'Number' }));
      const ruleRow = await screen.findByTestId(
        'visual-query-builder-rule-age'
      );
      const removeBtn = within(ruleRow).getByTestId(
        'visual-query-builder-rule-remove'
      );
      userEvent.click(removeBtn);
      expect(store.getState().queryBar.visualBuilder.rules).to.have.length(0);
    });

    it('clicking RUN invokes the host onRunQuery callback', function () {
      let runCount = 0;
      renderPanel(() => {
        runCount += 1;
      });
      const runBtn = screen
        .getAllByRole('button')
        .find((b) => /^Run$/i.test(b.textContent ?? ''));
      expect(runBtn).to.exist;
      userEvent.click(runBtn!);
      expect(runCount).to.equal(1);
    });

    // Regression: HTML implicit form submission used to click the rule row's
    // IconButton (which renders as <button> with no `type`, defaulting to
    // `submit`), so pressing Enter inside the value input wiped the rule
    // before onSubmit could run. We mitigate by setting type="button" on
    // every IconButton inside the panel.
    it('the Remove rule IconButton is type="button" so Enter does not implicitly submit it', function () {
      const { store } = renderPanel();
      store.dispatch(
        addFilterRule({ path: 'age', bsonType: 'Number', valueString: '18' })
      );
      const removeBtn = screen.getByTestId('visual-query-builder-rule-remove');
      expect(removeBtn.getAttribute('type')).to.equal('button');
    });
  });

  describe('value drag-and-drop', function () {
    const MIME = 'application/x-mongodb-value';

    // jsdom does not implement DataTransfer; fireEvent.drop accepts a plain
    // object with the same shape, so we provide a minimal stand-in.
    function makeDataTransfer(payload: {
      path: string;
      bsonType: string;
      valueString: string;
    }) {
      const stored = JSON.stringify(payload);
      return {
        types: [MIME],
        getData: (type: string) => (type === MIME ? stored : ''),
        // setData is unused on the drop path but kept for completeness.
        setData: () => undefined,
        dropEffect: 'copy',
        effectAllowed: 'copy',
      };
    }

    it('addFilterRule with a valueString seeds a valid rule', function () {
      const store = makeStore();
      store.dispatch(
        addFilterRule({
          path: 'age',
          bsonType: 'Number',
          valueString: '42',
        })
      );
      const vb = store.getState().queryBar.visualBuilder;
      expect(vb.rules).to.have.length(1);
      expect(vb.rules[0].valueString).to.equal('42');
      expect(vb.rules[0].valid).to.equal(true);
      // Default op for Number is $eq, which collapses to bare value.
      expect(store.getState().queryBar.fields.filter.string).to.equal(
        '{age:42}'
      );
    });

    it('dropping a value on the Query zone creates a new rule with the value', function () {
      const { store } = renderPanel();
      const zone = screen.getByTestId('drop-zone-zone-filter');

      const dataTransfer = makeDataTransfer({
        path: 'creation_time',
        bsonType: 'Date',
        valueString: '2025-12-23T17:28:46.175Z',
      });

      fireEvent.dragEnter(zone, { dataTransfer });
      fireEvent.dragOver(zone, { dataTransfer });
      fireEvent.drop(zone, { dataTransfer });

      const vb = store.getState().queryBar.visualBuilder;
      expect(vb.rules).to.have.length(1);
      expect(vb.rules[0].path).to.equal('creation_time');
      expect(vb.rules[0].bsonType).to.equal('Date');
      expect(vb.rules[0].valueString).to.equal('2025-12-23T17:28:46.175Z');
      // Date default operator is $gte (see OPERATORS_BY_TYPE).
      expect(vb.rules[0].operator).to.equal('$gte');
    });

    it('dropping a value on a rule’s value slot updates only that rule’s value', async function () {
      const { store } = renderPanel();
      store.dispatch(
        addFilterRule({
          path: 'policy',
          bsonType: 'String',
          valueString: 'old',
        })
      );

      const slot = await screen.findByTestId(
        'visual-query-builder-rule-value-slot-policy'
      );

      fireEvent.dragEnter(slot, {
        dataTransfer: makeDataTransfer({
          path: 'policy',
          bsonType: 'String',
          valueString: 'haimtest',
        }),
      });
      fireEvent.drop(slot, {
        dataTransfer: makeDataTransfer({
          path: 'policy',
          bsonType: 'String',
          valueString: 'haimtest',
        }),
      });

      const rule = store.getState().queryBar.visualBuilder.rules[0];
      expect(rule.path).to.equal('policy');
      expect(rule.operator).to.equal('$eq'); // unchanged from default
      expect(rule.valueString).to.equal('haimtest');
    });

    it('dropping a value on the Projection zone adds the field (value ignored)', function () {
      const { store } = renderPanel();
      const zone = screen.getByTestId('drop-zone-zone-projection');

      fireEvent.drop(zone, {
        dataTransfer: makeDataTransfer({
          path: 'name',
          bsonType: 'String',
          valueString: 'whatever',
        }),
      });

      const proj = store.getState().queryBar.visualBuilder.projection;
      expect(proj).to.have.length(1);
      expect(proj[0].path).to.equal('name');
      expect(proj[0].mode).to.equal(1);
    });

    it('dropping a value on the Sort zone adds an ascending sort (value ignored)', function () {
      const { store } = renderPanel();
      const zone = screen.getByTestId('drop-zone-zone-sort');

      fireEvent.drop(zone, {
        dataTransfer: makeDataTransfer({
          path: 'createdAt',
          bsonType: 'Date',
          valueString: '2025-12-23T17:28:46.175Z',
        }),
      });

      const sort = store.getState().queryBar.visualBuilder.sort;
      expect(sort).to.have.length(1);
      expect(sort[0].path).to.equal('createdAt');
      expect(sort[0].direction).to.equal(1);
    });

    it('ignores drops missing the MIME type', function () {
      const { store } = renderPanel();
      const zone = screen.getByTestId('drop-zone-zone-filter');

      fireEvent.drop(zone, {
        dataTransfer: {
          types: ['text/plain'],
          getData: () => '',
          dropEffect: 'none',
          effectAllowed: 'none',
        },
      });

      expect(store.getState().queryBar.visualBuilder.rules).to.have.length(0);
    });
  });
});
