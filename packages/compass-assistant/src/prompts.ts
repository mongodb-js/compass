export const buildExplainPlanPrompt = ({
  explainPlan,
}: {
  explainPlan: string;
}) => {
  return {
    prompt: `Given the MongoDB explain plan output below, provide a concise human readable explanation that explains the query execution plan and highlights aspects of the plan that might impact query performance. Respond with as much concision and clarity as possible.
If a clear optimization should be made, please suggest the optimization and describe how it can be accomplished in MongoDB Compass. Do not advise users to create indexes without weighing the pros and cons. 
Explain output: 
${explainPlan}`,
    displayText: 'Provide an explanation of this explain plan.',
  };
};

export const buildConnectionErrorPrompt = ({
  connectionString,
  connectionError,
}: {
  connectionString: string;
  connectionError: string;
}) => {
  return {
    prompt: `Given the error message below, please provide clear instructions to guide the user to debug their connection attempt from MongoDB Compass. If no auth mechanism is specified in the connection string, the default (username/password) is being used:

Connection string (password redacted):
${connectionString}

Error message:
${connectionError}`,
  };
};
