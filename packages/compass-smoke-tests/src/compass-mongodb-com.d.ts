declare module 'compass-mongodb-com' {
  import type http from 'http';
  function updateServer(): {
    start: () => void;
    httpServer: http.Server;
    updateChecker: NodeJS.EventEmitter;
  };
  export = updateServer;
}
