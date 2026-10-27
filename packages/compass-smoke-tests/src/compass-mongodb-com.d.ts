declare module 'compass-mongodb-com' {
  import type http from 'node:http';
  function updateServer(): {
    start: () => void;
    httpServer: http.Server;
    updateChecker: NodeJS.EventEmitter;
  };
  export = updateServer;
}
