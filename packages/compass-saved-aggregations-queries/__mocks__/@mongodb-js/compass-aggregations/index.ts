let pipelines = [];

export function _setPipelines(newPipelines = []): void {
  pipelines = newPipelines;
}

export function readPipelinesFromStorage(): Promise<typeof pipelines> {
  return Promise.resolve(pipelines);
}
