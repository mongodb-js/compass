import { ipcRenderer } from 'hadron-ipc';
import type { MCPServiceMain } from './mcp-service-main';

export class MCPService {
  private _ipc = ipcRenderer?.createInvoke<
    typeof MCPServiceMain,
    'setupNewConnection'
  >('MCPService', ['setupNewConnection']);

  private get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  setupNewConnection({
    cs,
    connId,
    telemetry,
  }: {
    cs: string;
    connId: string;
    telemetry: boolean;
  }): Promise<boolean> {
    return this.ipc.setupNewConnection({ cs, connId, telemetry });
  }
}
