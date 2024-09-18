type ClusterOrServerlessId =
  | { serverlessId?: never; clusterId: string }
  | { serverlessId: string; clusterId?: never };

export type AutomationAgentRequestTypes = {
  listIndexStats: ClusterOrServerlessId & {
    db: string;
    collection: string;
  };
  index: ClusterOrServerlessId & {
    db: string;
    collection: string;
    keys: string;
    options: string;
    collationOptions: string;
  };
  dropIndex: ClusterOrServerlessId & {
    db: string;
    collection: string;
    name: string;
  };
};

type AutomationAgentRequestOpTypes = keyof AutomationAgentRequestTypes;

type AutomationAgentRequestResponse<
  OpType extends AutomationAgentRequestOpTypes
> = {
  _id: string;
  requestType: OpType;
};

function assertAutomationAgentRequestResponse<
  OpType extends AutomationAgentRequestOpTypes
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

export type AutomationAgentAwaitResponseTypes = {
  listIndexStats: {
    collName: string;
    dbName: string;
    indexName: string;
    indexProperties: { label: string; properties: Record<string, unknown> }[];
    indexType: { label: string };
    keys: { name: string; value: string | number };
    sizeBytes: number;
    status: 'rolling build' | 'building' | 'exists';
  }[];
  dropIndex: never[];
};

type AutomationAgentAwaitOpTypes = keyof AutomationAgentAwaitResponseTypes;

type AutomationAgentAwaitResponse<OpType extends AutomationAgentAwaitOpTypes> =
  {
    _id: string;
    requestID: string;
    requestType: OpType;
    response: AutomationAgentAwaitResponseTypes[OpType];
    type: OpType;
  };

function assertAutomationAgentAwaitResponse<
  OpType extends AutomationAgentAwaitOpTypes
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

type PickAwaitResponse<OpType extends AutomationAgentAwaitOpTypes> =
  AutomationAgentAwaitResponse<OpType>['response'];

/**
 * Helper type that maps whatever is returned by automation agent in response
 * prop as follows:
 *
 * empty array -> undefined
 * array with one item -> unwrapped item
 * array of items -> array of items
 */
export type UnwrappedAutomationAgentAwaitResponse<
  OpType extends AutomationAgentAwaitOpTypes
> = PickAwaitResponse<OpType> extends never[]
  ? undefined
  : PickAwaitResponse<OpType> extends [infer UnwrappedResponse]
  ? UnwrappedResponse
  : PickAwaitResponse<OpType> extends Array<unknown>
  ? PickAwaitResponse<OpType>
  : never;

function unwrapAutomationAgentAwaitResponse(
  json: any,
  opType: 'listIndexStats'
): UnwrappedAutomationAgentAwaitResponse<'listIndexStats'>;
function unwrapAutomationAgentAwaitResponse(
  json: any,
  opType: 'dropIndex'
): UnwrappedAutomationAgentAwaitResponse<'dropIndex'>;
function unwrapAutomationAgentAwaitResponse(json: any, opType: string): never;
function unwrapAutomationAgentAwaitResponse(
  json: any,
  opType: string
): unknown {
  if (opType === 'dropIndex') {
    assertAutomationAgentAwaitResponse(json, opType);
    // `dropIndex` returns an empty array, so returning undefined here is just a
    // bit more explicit than returning `json.response[0]` instead
    return undefined;
  }
  if (opType === 'listIndexStats') {
    assertAutomationAgentAwaitResponse(json, opType);
    return json.response;
  }
  throw new Error(`Unsupported await response type: ${opType}`);
}

export type AutomationAgentResponse<
  OpType extends AutomationAgentRequestOpTypes
> = OpType extends AutomationAgentAwaitOpTypes
  ? UnwrappedAutomationAgentAwaitResponse<OpType>
  : undefined;

async function makeAutomationAgentOpRequest<
  OpType extends AutomationAgentRequestOpTypes
>(
  fetchFn: typeof fetch,
  baseUrl: string,
  projectId: string,
  opType: OpType,
  opBody: AutomationAgentRequestTypes[OpType]
): Promise<AutomationAgentResponse<OpType>> {
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
  // on (a successful response is already an acknowledgement that request to
  // create an index was registered), so we just end here
  if (opType === 'index') {
    return undefined as AutomationAgentResponse<OpType>;
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
  return unwrapAutomationAgentAwaitResponse(awaitJson, opType);
}

export { makeAutomationAgentOpRequest };
