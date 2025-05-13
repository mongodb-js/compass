import { ipcRenderer } from 'hadron-ipc';
import type { MCPServiceMain } from './mcp-service-main';

export class MCPService {
  private _ipc = ipcRenderer?.createInvoke<
    typeof MCPServiceMain,
    'setupNewConnection' | 'startChatSession' | 'sendChatMessage'
  >('MCPService', [
    'setupNewConnection',
    'startChatSession',
    'sendChatMessage',
  ]);

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

  startChatSession({ connId }: { connId: string }): Promise<boolean> {
    return this.ipc.startChatSession({ connId });
  }

  sendChatMessage({
    connId,
    message,
  }: {
    connId: string;
    message: string;
  }): Promise<any> {
    return this.ipc.sendChatMessage({ connId, message });
  }
}
