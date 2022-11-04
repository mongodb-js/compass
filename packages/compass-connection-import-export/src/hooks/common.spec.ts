import { expect } from 'chai';
import sinon from 'sinon';
import {
  useImportExportConnectionsCommon,
  COMMON_INITIAL_STATE,
  makeConnectionInfoFilter,
} from './common';
import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';

describe('common utilities', function () {
  describe('useImportExportConnectionsCommon', function () {
    it('provides a callback for closing the modal', function () {
      const finish = sinon.stub();
      const { result } = renderHook(() => {
        const [state, setState] = useState(COMMON_INITIAL_STATE);
        const common = useImportExportConnectionsCommon(setState, finish);
        return [state, common] as const;
      });

      act(() => {
        result.current[1].onCancel();
      });

      expect(finish).to.have.been.calledOnceWith('canceled');
    });

    it('provides a callback for updating the selected list of connections', function () {
      const { result } = renderHook(() => {
        const [state, setState] = useState(COMMON_INITIAL_STATE);
        const common = useImportExportConnectionsCommon(setState, () => {});
        return [state, common] as const;
      });

      const newList = [{ id: 'id', name: 'name', selected: true }];
      act(() => {
        result.current[1].onChangeConnectionList(newList);
      });

      expect(result.current[0].connectionList).to.deep.equal(newList);
    });

    it('provides a callback for updating the current passphrase', function () {
      const { result } = renderHook(() => {
        const [state, setState] = useState(COMMON_INITIAL_STATE);
        const common = useImportExportConnectionsCommon(setState, () => {});
        return [state, common] as const;
      });

      act(() => {
        result.current[1].onChangePassphrase('s3cr3t');
      });
      expect(result.current[0].passphrase).to.equal('s3cr3t');
    });
  });

  describe('makeConnectionInfoFilter', function () {
    it('creates a filter function from a list of selected connections', function () {
      const filter = makeConnectionInfoFilter([
        { id: 'id1', name: 'name1', selected: true },
        { id: 'id2', name: 'name2', selected: false },
      ]);
      expect(filter({ id: 'id1' })).to.equal(true);
      expect(filter({ id: 'id2' })).to.equal(false);
      expect(filter({ id: 'none' })).to.equal(false);
    });
  });
});
