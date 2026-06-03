import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  cleanup,
  act,
} from '@mongodb-js/testing-library-compass';
import { ipcRenderer } from 'hadron-ipc';
import { MCP_IPC } from '@mongodb-js/compass-mcp-server';
import { McpConsentDialog } from './mcp-consent-dialog';

type IpcHandler = (event: unknown, request: unknown) => void;

// Captures the consent-request handler the dialog registers, lets us fire
// synthetic main-process events into it, and snoops on what it sends back.
function setupIpcSpy() {
  if (!ipcRenderer) throw new Error('ipcRenderer unavailable in this env');
  const handlers = new Map<string, IpcHandler>();
  sinon
    .stub(ipcRenderer, 'on')
    .callsFake((channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
      return ipcRenderer;
    });
  sinon.stub(ipcRenderer, 'removeListener').callsFake((channel: string) => {
    handlers.delete(channel);
    return ipcRenderer;
  });
  const send = sinon.stub(ipcRenderer, 'send');
  return {
    fireRequest: (request: {
      requestId: string;
      connectionId: string;
      connectionName: string;
      clientName: string;
    }) => {
      const handler = handlers.get(MCP_IPC.ConsentRequest);
      if (!handler) throw new Error('dialog did not register a handler');
      act(() => handler({}, request));
    },
    send,
  };
}

describe('McpConsentDialog', function () {
  let spies: ReturnType<typeof setupIpcSpy>;

  beforeEach(function () {
    spies = setupIpcSpy();
  });

  afterEach(function () {
    sinon.restore();
    cleanup();
  });

  // The dialog is gated on a pending consent request. Without one it renders
  // nothing — every test below first fires a request to materialize the UI.
  function fireDefaultRequest() {
    spies.fireRequest({
      requestId: 'req-1',
      connectionId: 'conn-1',
      connectionName: 'production-orders',
      clientName: 'claude-ai',
    });
  }

  it('renders nothing before a consent request arrives', function () {
    render(<McpConsentDialog />);
    expect(screen.queryByTestId('mcp-consent-dialog')).to.equal(null);
  });

  it('shows the AI client name and the connection name in the header', function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    // The body reads: "claude-ai wants to use your production-orders MongoDB connection."
    expect(screen.getByText(/claude-ai/)).to.exist;
    expect(screen.getByText(/production-orders/)).to.exist;
  });

  it('defaults to the read-only preset radio', function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    // LeafyGreen Radio renders an input[type=radio]; checked reflects state.
    const readOnly = screen.getByRole('radio', { name: /read-only data/i });
    expect((readOnly as HTMLInputElement).checked).to.equal(true);
  });

  it('sends the chosen preset back when the user clicks Allow', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(
      screen.getByRole('radio', { name: /metadata only/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /allow/i }));
    expect(spies.send.callCount).to.equal(1);
    const [channel, payload] = spies.send.firstCall.args as [
      string,
      { access: { mode: string; preset?: string }; remember: boolean }
    ];
    expect(channel).to.equal(MCP_IPC.consentResponse('req-1'));
    expect(payload.access).to.deep.equal({
      mode: 'allowed',
      preset: 'metadata-only',
    });
    expect(payload.remember).to.equal(false);
  });

  it('disables Allow until the user confirms full-access via the second-confirm checkbox', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(screen.getByRole('radio', { name: /full access/i }));
    const allow = screen.getByRole('button', { name: /allow/i });
    expect((allow as HTMLButtonElement).disabled).to.equal(true);
    // Banner with the second-confirm checkbox renders only for full-access.
    await userEvent.click(
      screen.getByRole('checkbox', { name: /allow full access/i })
    );
    expect((allow as HTMLButtonElement).disabled).to.equal(false);
  });

  it('clears the full-access confirmation when switching away from full-access', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(screen.getByRole('radio', { name: /full access/i }));
    await userEvent.click(
      screen.getByRole('checkbox', { name: /allow full access/i })
    );
    // Switch back to read-only — the checkbox should reset.
    await userEvent.click(screen.getByRole('radio', { name: /read-only/i }));
    // And the full-access checkbox should no longer be in the DOM at all
    // because the banner only renders under full-access.
    expect(
      screen.queryByRole('checkbox', { name: /allow full access/i })
    ).to.equal(null);
    // Re-pick full-access — checkbox should come back unchecked.
    await userEvent.click(screen.getByRole('radio', { name: /full access/i }));
    const confirm = screen.getByRole('checkbox', {
      name: /allow full access/i,
    });
    expect((confirm as HTMLInputElement).checked).to.equal(false);
  });

  it('forwards `remember: true` when the user checks Remember', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(
      screen.getByRole('checkbox', { name: /remember my choice/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /allow/i }));
    const payload = spies.send.firstCall.args[1] as { remember: boolean };
    expect(payload.remember).to.equal(true);
  });

  it('sends mode: "denied" when the user clicks Cancel', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    const payload = spies.send.firstCall.args[1] as {
      access: { mode: string };
    };
    expect(payload.access).to.deep.equal({ mode: 'denied' });
  });

  it('closes after responding so the next request can render fresh', async function () {
    render(<McpConsentDialog />);
    fireDefaultRequest();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    // Modal should be gone.
    expect(screen.queryByTestId('mcp-consent-dialog')).to.equal(null);
    // A second request renders again with defaults — preset back to read-only,
    // remember unchecked.
    spies.fireRequest({
      requestId: 'req-2',
      connectionId: 'conn-2',
      connectionName: 'staging',
      clientName: 'cursor-vscode',
    });
    const readOnly = screen.getByRole('radio', { name: /read-only data/i });
    expect((readOnly as HTMLInputElement).checked).to.equal(true);
  });

  it("responds on the per-request channel so concurrent requests don't cross-talk", async function () {
    render(<McpConsentDialog />);
    spies.fireRequest({
      requestId: 'unique-req-abc',
      connectionId: 'c',
      connectionName: 'n',
      clientName: 'a',
    });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(spies.send.firstCall.args[0]).to.equal(
      MCP_IPC.consentResponse('unique-req-abc')
    );
  });
});
