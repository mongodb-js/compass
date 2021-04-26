export default interface Closable {
  /**
   * Close the connection.
   *
   * @param {boolean} force - Whether to force close.
   */
  close(force: boolean): Promise<void>;
}
