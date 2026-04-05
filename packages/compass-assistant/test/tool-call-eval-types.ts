export type ConnectionConfig = {
  connectionId: string;
  connectionString: string;
  connectOptions: {
    productDocsLink: string;
    productName: string;
  };
};

export type AssistantApiConfig = {
  baseURL: string;
  apiKey: string;
  requestOrigin: string;
  userAgent: string;
};

export type EvalTaskConfig = {
  apiConfig: AssistantApiConfig;
  connectionConfig: ConnectionConfig;
};
