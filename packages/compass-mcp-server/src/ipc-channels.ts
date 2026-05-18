/**
 * IPC channel names used between the Compass main process (where the MCP
 * server lives) and the renderer (where the consent dialog, Settings panel,
 * and workspace navigation listen).
 *
 * Centralized so each name is declared exactly once — typos in renderer code
 * silently break IPC, and grep-ability across packages matters when adding
 * a new channel.
 *
 * Naming: every channel is prefixed `mcp:` to namespace it cleanly against
 * other Compass IPC traffic.
 */
export const MCP_IPC = {
  /**
   * Renderer → main, request/response. Returns the current server status:
   *   `{ status: 'running' } | { status: 'stopped' } | { status: 'error', error }`.
   */
  GetStatus: 'mcp:get-status',

  /**
   * Main → all renderers, broadcast. Fires whenever the server starts,
   * stops, or fails to start. Payload shape matches `GetStatus`.
   */
  StatusUpdate: 'mcp:status-update',

  /**
   * Renderer → main, request/response. Returns the bridge command/args the
   * settings panel renders into AI-client config snippets, plus per-client
   * config paths.
   */
  GetBridgeInfo: 'mcp:get-bridge-info',

  /**
   * Renderer → main, request. Reveals the given AI-client config file in
   * the user's file browser.
   */
  OpenConfigFile: 'mcp:open-config-file',

  /**
   * Renderer → main, request/response. Writes the Compass MCP entry into
   * the given AI-client's config file.
   */
  InstallInClient: 'mcp:install-in-client',

  /**
   * Renderer → main, request. Removes the Compass MCP entry from the given
   * AI-client's config file.
   */
  UninstallFromClient: 'mcp:uninstall-from-client',

  /**
   * Renderer → main, request/response. Checks whether our entry is present
   * (and matches the current bridge command) in the given AI-client's
   * config file.
   */
  DetectInClient: 'mcp:detect-in-client',

  /**
   * Main → renderer, broadcast. Fires when an MCP client first asks to use
   * a Compass connection that doesn't yet have a stored access decision.
   * The renderer shows `<McpConsentDialog>` and replies on
   * `consentResponse(requestId)`.
   */
  ConsentRequest: 'mcp:consent-request',

  /**
   * Renderer → main, one-shot reply for the matching `ConsentRequest`.
   * Per-request channel — see `consentResponse(requestId)`.
   */
  consentResponse: (requestId: string): string =>
    `mcp:consent-response:${requestId}`,

  /**
   * Main → all renderers, broadcast. Fires when the AI calls the
   * `compass-open-collection` tool. The renderer's navigation listener
   * opens a workspace tab for the requested namespace.
   */
  OpenCollection: 'mcp:open-collection',
} as const;
