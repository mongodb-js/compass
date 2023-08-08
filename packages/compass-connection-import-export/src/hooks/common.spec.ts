import { expect } from 'chai';
import sinon from 'sinon';
import {
  useImportExportConnectionsCommon,
  COMMON_INITIAL_STATE,
  useOpenModalThroughIpc,
} from './common';
import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';
import EventEmitter from 'events';

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

  describe('useOpenModalThroughIpc', function () {
    it("allows modifying a modal's state through ipc events", function () {
      const fakeIpc = new EventEmitter();
      const event = 'test:open-modal';

      const { result } = renderHook(() => {
        const [open, setOpen] = useState(false);
        useOpenModalThroughIpc(open, setOpen, event, fakeIpc as any);
        return { open, setOpen };
      });

      expect(result.current.open).to.equal(false);
      expect(fakeIpc.listenerCount(event)).to.equal(1);

      act(() => {
        fakeIpc.emit(event);
      });
      expect(result.current.open).to.equal(true);
      expect(fakeIpc.listenerCount(event)).to.equal(0);

      act(() => {
        result.current.setOpen(false);
      });
      expect(result.current.open).to.equal(false);
      expect(fakeIpc.listenerCount(event)).to.equal(1);
    });
  });
});
