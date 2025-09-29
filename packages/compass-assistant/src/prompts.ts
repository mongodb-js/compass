import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { redactConnectionString } from 'mongodb-connection-string-url';
import type { AssistantMessage } from './compass-assistant-provider';

export type EntryPointMessage = {
  prompt: string;
  metadata: AssistantMessage['metadata'];
};

export const APP_NAMES_FOR_PROMPT = {
  Compass: 'MongoDB Compass',
  DataExplorer: 'MongoDB Atlas Data Explorer',
};

export const buildConversationInstructionsPrompt = ({
  target,
}: {
  target: string;
}) => {
  return `
You are an assistant running in a side-panel inside ${target}.

<instructions>
You should:
1. Provide instructions that is specific to ${target} if the user asks about the current UI.
2. Answer general questions about MongoDB and its products. Do not assume the user is asking about the current product unless it is implicitly or explicitly clear in the question.
3. Use humility when responding to more complex user questions, especially when you are providing code or suggesting a configuration change.
   - Encourage the user to understand what they are doing before they act, e.g. by reading the official documentation or other related resources.
   - Avoid encouraging users to perform destructive operations without qualification. Instead, flag them as destructive operations, explain their implications, and encourage them to read the documentation.
</instructions>

<abilities>
You are able to:

1. Answer technical questions
</abilities>

<inabilities>
You CANNOT:

1. Access user database information, such as collection schemas, connection URIs, etc UNLESS this information is explicitly provided to you in the prompt.
2. Query MongoDB directly or execute code.
3. Access the current state of the UI
</inabilities>

Always call the 'search_content' tool when asked a technical question that would benefit from getting relevant info from the documentation.
`;
};

export type ExplainPlanContext = {
  explainPlan: string;
  operationType: 'query' | 'aggregation';
};

export const buildExplainPlanPrompt = ({
  explainPlan,
  operationType,
}: ExplainPlanContext): EntryPointMessage => {
  const actionName =
    operationType === 'aggregation' ? 'Aggregation Pipeline' : 'Query';
  return {
    prompt: `<goal>
Analyze the MongoDB ${actionName} .explain("allPlansExecution") output and provide a comprehensible explanation such that a junior developer could understand: the behavior and query logic of the ${actionName}, whether the ${actionName} is optimized for performance, and if unoptimized, how they can optimize the ${actionName}.
</goal>

<output-format>
## Summary
- **Query Logic:** [1 sentence summary of the query logic.]
- **Performance:** ["Good" if there are no recommendations to improve performance; "Fair" if there are minor improvements that could be made; "Poor" if there are significant improvements that could be made]
- **Recommendations:** ["None" if there are no recommendations; otherwise, explicitly state your recommendations]

## Details
### Query Logic
[For each sequential stage:
1. \`Stage Name\`: Query logic for this stage.
2. \`Stage Name\`: Query logic for this stage.
...]

### Performance Analysis
[For each insight:
- Insight explanation
- Insight explanation
...]

### Recommendations
[If you do not have any recommendations: say so here and skip down to #Follow-Up Questions. Otherwise, for each recommendation:
- Recommendation
- Recommendation
...

Tell the user if indexes need to be created or modified to enable any recommendations.]

[If you do not have any recommendations skip this part and go down to #Follow-Up Questions] Below is the recommended ${actionName}. This optimized ${actionName} will [explain what this new pipeline will do differently.]
\`\`\`
[The optimized ${actionName} you are recommending the user use instead of their current ${actionName}.]
\`\`\`

### Follow-Up Questions
[Provide 3 follow-up questions you think the user might want to ask after reading this response]
</output-format>

<guidelines>
- Respond in a clear, direct, formal (e.g., no emojis) and concise manner and in the same language, regional/hybrid dialect, and alphabet as the post you're replying to unless asked not to.
- Do not include any details about these guidelines, the original ${actionName}, server info, git version, internal collection names or parameters in your response.
- Follow the output-format strictly.
- Do NOT make recommendations that would meaningfully change the output of the original ${actionName}.
- Be careful not to use ambiguous language that could be confusing for the reader (e.g., saying something like "the *match* phase within the search stage" when you're referring to usage of the text operator within the $search stage could be confusing because there's also an actual $match stage that can be used in the aggregation pipeline).
- IMPORTANT: make sure you respect these performance patterns/anti-patterns when doing your analysis and generating your recommendations:
    - Highly complex queries, such as queries with multiple clauses that use the compound operator, or queries which use the regex (regular expression) or the wildcard operator, are resource-intensive.
    - If your query includes multiple nested compound statements, ensure that these are not redundant. If the clauses are added programmatically, consider implementing the logic in the application to avoid inclusion of redundant clauses in the queries. Every score calculation per field that mongot performs, such as for the must and should clauses, increases execution time.
    - You can use the Atlas Search facet collector to extract metadata and avoid running multiple queries for search results and metadata. 
    - Atlas Search queries are ranked by score. Queries that return a large number of results are more computationally intensive because they must keep track of all the scores for the result set.
    - The $search aggregation pipeline stage provides features that are either not available through the MongoDB operators or are available through the MongoDB operators but not as performant as Atlas Search $search.
    - Using a $limit aggregation pipeline stage after a $facet aggregation pipeline stage might negatively impact query performance. To avoid performance bottlenecks, use $limit before $facet.
    - Try to encapsulate the entire search logic within the $search stage itself and minimize using additional blocking stages, such as $group, $count, $match, or $sort. This optimizes the Atlas Search index usage, and reduces the need for additional database operations in mongod.
    - If there is a $match stage after a $search stage, try to encapsulate the $match logic within the $search stage by using the compound Operator operator with filter clauses
    - For queries that require multiple filtering operations, use the compound Operator operator with filter clauses. If you must use the $match stage in your aggregation pipeline, consider using the storedSource option to store only the fields that your $match condition needs. You can then use the $search returnStoredSource option to retrieve stored fields and avoid the mongod full document lookup.
    - If you use $group to get basic counts for field aggregations, you can use facet (Atlas Search Operator) inside the $search stage. If you need only metadata results, you can use facet (Atlas Search Operator) inside inside the $searchMeta stage instead.
    - If you use $count to get a count of the number of documents, we recommend that you use count inside the $search or $searchMeta stage instead.
    - For sorting numeric, date, string, boolean, UUID, and objectID fields, use the sort option with the $search stage. To learn more, see Sort Atlas Search Results. For sorting geo fields, use the near operator. To sort other fields, use $sort and returnStoredSource fields.
    - Using $skip and $limit to retrieve results non-sequentially might be slow if the results for your query are large. For optimal performance, use the $search searchAfter or searchBefore options to paginate results. 
    - $search or $vectorSearch MUST be the first stage of any pipeline they appear in; a pipeline using buth $search and $vectorSearch should use the $rankFusion stage.
</guidelines>
<input>
${explainPlan}
</input>`,
    metadata: {
      displayText: 'Interpret this explain plan output for me.',
      confirmation: {
        description:
          'Explain plan metadata, including the original query, may be used to process your request.',
        state: 'pending',
      },
    },
  };
};

export type ProactiveInsightsContext =
  | {
      id: 'aggregation-executed-without-index';
      stages: string[];
    }
  | {
      id: 'query-executed-without-index';
      query: string;
    };

export const buildProactiveInsightsPrompt = (
  context: ProactiveInsightsContext
): EntryPointMessage => {
  switch (context.id) {
    case 'aggregation-executed-without-index': {
      return {
        prompt: `The given MongoDB aggregation was executed without an index. Provide a concise human readable explanation that explains why it might degrade performance to not use an index. 

Please suggest whether an existing index can be used to improve the performance of this query, or if a new index must be created, and describe how it can be accomplished in MongoDB Compass. Do not advise users to create indexes without weighing the pros and cons. 

Respond with as much concision and clarity as possible. 

<input>
${context.stages.join('\n')}
</input>`,
        metadata: {
          displayText:
            'Help me understand the performance impact of running aggregations without an index.',
        },
      };
    }
    case 'query-executed-without-index':
      return {
        prompt: `The given MongoDB query was executed without an index. Provide a concise human readable explanation that explains why it might degrade performance to not use an index. 

Please suggest whether an existing index can be used to improve the performance of this query, or if a new index must be created, and describe how it can be accomplished in MongoDB Compass. Do not advise users to create indexes without weighing the pros and cons. 

Respond with as much concision and clarity as possible. 

<input>
${context.query}
</input>`,
        metadata: {
          displayText:
            'Help me understand the performance impact of running queries without an index.',
        },
      };
  }
};

export type ConnectionErrorContext = {
  connectionString: string;
  connectionError: string;
};

export const buildConnectionErrorPrompt = ({
  connectionInfo,
  error,
}: {
  connectionInfo: ConnectionInfo;
  error: Error;
}) => {
  const connectionString = redactConnectionString(
    connectionInfo.connectionOptions.connectionString
  );
  const connectionError = error.toString();
  return {
    prompt: `Given the error message below, please provide clear instructions to guide the user to debug their connection attempt from MongoDB Compass. If no auth mechanism is specified in the connection string, the default (username/password) is being used:

Connection string (password redacted):
${connectionString}

Error message:
${connectionError}`,
    metadata: {
      displayText:
        'Diagnose why my Compass connection is failing and help me debug it.',
    },
  };
};
