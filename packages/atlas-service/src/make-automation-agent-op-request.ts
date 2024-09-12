type ClusterOrServerlessId =
  | { serverlessId?: never; clusterId: string }
  | { serverlessId: string; clusterId?: never };

export type AutomationAgentRequestOpTypes = {
  listIndexStats: [
    ClusterOrServerlessId & { db: string; collection: string },
    {
      collName: string;
      dbName: string;
      indexName: string;
      indexProperties: { label: string; properties: Record<string, unknown> }[];
      indexType: { label: string };
      keys: { name: string; value: string | number };
      sizeBytes: number;
      status: 'rolling build' | 'building' | 'exists';
    }[]
  ];
  index: [
    ClusterOrServerlessId & {
      db: string;
      collection: string;
      keys: string;
      options: string;
      collationOptions: string;
    },
    void
  ];
  dropIndex: [
    ClusterOrServerlessId & {
      db: string;
      collection: string;
      name: string;
    },
    void
  ];
};

type AutomationAgentRequestResponse<
  OpType extends keyof AutomationAgentRequestOpTypes
> = {
  _id: string;
  requestType: OpType;
};

function assertAutomationAgentRequestResponse<
  OpType extends keyof AutomationAgentRequestOpTypes
>(
  json: any,
  opType: OpType
): asserts json is AutomationAgentRequestResponse<OpType> {
  if (
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    json.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request'
  );
}

type AutomationAgentAwaitResponse<
  OpType extends keyof AutomationAgentRequestOpTypes,
  Response = AutomationAgentRequestOpTypes[OpType][1]
> = {
  _id: string;
  requestID: string;
  requestType: OpType;
  response: Response extends ArrayLike<any> ? Response : Response[];
  type: OpType;
};

function assertAutomationAgentAwaitResponse<
  OpType extends keyof AutomationAgentRequestOpTypes
>(
  json: any,
  opType: OpType
): asserts json is AutomationAgentAwaitResponse<OpType> {
  if (
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    Object.prototype.hasOwnProperty.call(json, 'response') &&
    json.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request await'
  );
}

export async function makeAutomationAgentOpRequest<
  OpType extends keyof AutomationAgentRequestOpTypes
>(
  fetchFn: typeof fetch,
  baseUrl: string,
  projectId: string,
  opType: OpType,
  opBody: AutomationAgentRequestOpTypes[OpType][0]
): Promise<AutomationAgentRequestOpTypes[OpType][1]> {
  const requestUrl =
    baseUrl + encodeURI(`/explorer/v1/groups/${projectId}/requests/${opType}`);
  // Tell automation agent to run the op first, this will return the id that we
  // can use to track the job result
  const requestRes = await fetchFn(requestUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(opBody),
  });
  // Rolling index creation request doesn't return anything that we can "await"
  // on, so we just end here
  if (opType === 'index') {
    return undefined;
  }
  const requestJson = await requestRes.json();
  assertAutomationAgentRequestResponse(requestJson, opType);
  const awaitUrl =
    baseUrl +
    encodeURI(
      `/explorer/v1/groups/${projectId}/requests/${requestJson._id}/types/${opType}/await`
    );
  const awaitRes = await fetchFn(awaitUrl, { method: 'GET' });
  const awaitJson = await awaitRes.json();
  if (opType === 'listIndexStats') {
    assertAutomationAgentAwaitResponse<'listIndexStats'>(awaitJson, opType);
    return awaitJson.response;
  }
  if (opType === 'dropIndex') {
    return undefined;
  }
}
