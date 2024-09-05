import FieldStorePlugin from './';
import { useAutocompleteFields } from './';
import { expect } from 'chai';
import { useFieldStoreService } from './stores/field-store-service';
import {
  renderPluginHookWithActiveConnection,
  cleanup,
  waitFor,
} from '@mongodb-js/testing-library-compass';

describe('useAutocompleteFields', function () {
  afterEach(cleanup);

  it('returns empty list when namespace schema is not available', async function () {
    const { result } = await renderPluginHookWithActiveConnection(
      () => useAutocompleteFields('foo.bar'),
      FieldStorePlugin,
      {}
    );

    expect(result.current).to.deep.eq([]);
  });

  it('updates when fields are added', async function () {
    const { result } = await renderPluginHookWithActiveConnection(
      () => {
        const autoCompleteFields = useAutocompleteFields('foo.bar');
        const fieldStoreService = useFieldStoreService();
        return {
          getAutoCompleteFields() {
            return autoCompleteFields;
          },
          getFieldStoreService() {
            return fieldStoreService;
          },
        };
      },
      FieldStorePlugin,
      {}
    );

    await result.current
      .getFieldStoreService()
      .updateFieldsFromDocuments('foo.bar', [
        { foo: 1 },
        { bar: false },
        { buz: 'str' },
      ]);

    await waitFor(() => {
      expect(result.current.getAutoCompleteFields()).have.lengthOf(3);
    });

    expect(result.current.getAutoCompleteFields()).to.deep.eq([
      {
        name: 'bar',
        value: 'bar',
        score: 1,
        meta: 'field',
        version: '0.0.0',
        description: 'Boolean | Undefined',
      },
      {
        name: 'buz',
        value: 'buz',
        score: 1,
        meta: 'field',
        version: '0.0.0',
        description: 'String | Undefined',
      },
      {
        name: 'foo',
        value: 'foo',
        score: 1,
        meta: 'field',
        version: '0.0.0',
        description: 'Number | Undefined',
      },
    ]);
  });
});
