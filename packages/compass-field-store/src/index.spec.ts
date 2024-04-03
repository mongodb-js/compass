import { renderHook, cleanup } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import FieldStorePlugin from './';
import { useAutocompleteFields } from './';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { useConnectionInfoAccess } from '@mongodb-js/connection-storage/provider';
import { useDispatch } from './stores/context';
import { createFieldStoreService } from './stores/field-store-service';

export const useFieldStoreServiceForTests = () => {
  const dispatch = useDispatch();
  const connectionInfoAccess = useConnectionInfoAccess();
  return createFieldStoreService(dispatch, connectionInfoAccess);
};

describe('useAutocompleteFields', function () {
  let appRegistry: AppRegistry;
  let Plugin: ReturnType<typeof FieldStorePlugin['withMockServices']>;

  beforeEach(function () {
    appRegistry = new AppRegistry();
    Plugin = FieldStorePlugin.withMockServices({
      globalAppRegistry: appRegistry,
    });
  });

  afterEach(cleanup);

  it('returns empty list when namespace schema is not available', function () {
    const { result } = renderHook(() => useAutocompleteFields('foo.bar'), {
      wrapper: Plugin,
    });

    expect(result.current).to.deep.eq([]);
  });

  it('updates when fields are added', async function () {
    const { result } = renderHook(
      () => {
        const autoCompleteFields = useAutocompleteFields('foo.bar');
        const fieldStoreService = useFieldStoreServiceForTests();
        return {
          getAutoCompleteFields() {
            return autoCompleteFields;
          },
          getFieldStoreService() {
            return fieldStoreService;
          },
        };
      },
      {
        wrapper: Plugin,
      }
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
