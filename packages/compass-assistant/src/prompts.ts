export const buildConversationInstructionsPrompt = ({
  target = 'Compass',
}: {
  target: 'Data Explorer' | 'Compass';
}) => {
  // TODO: we'll want to greatly expand on this, but at minimum this is where we
  // make the distinction between running inside Data Explorer vs Compass.
  return `You are an assistant running inside ${target}.`;
};

export const buildExplainPlanPrompt = ({
  indexes,
  query,
  aggregation,
  schema,
  explainPlan,
}: {
  // TODO: These are all optional because Compass does not pass them in yet, but
  // it allows us to test prompts that use them.
  indexes?: string;
  query?: string;
  aggregation?: string;
  schema?: string;
  explainPlan: string;
}) => {
  const basePrompt = `
<goal>
Analyze the MongoDB Aggregation Pipeline .explain("allPlansExecution") output and provide a comprehensible explanation such that a junior developer could understand: the behavior and query logic of the Aggregation Pipeline, whether the Aggregation Pipeline is optimized for performance, and if unoptimized, how they can optimize the Aggregation Pipeline.
</goal>

<output-format>
#Summary
- **Query Logic:** [1 sentence summary of the query logic.]
- **Performance:** ["Good" if there are no recommendations to improve performance; "Fair" if there are minor improvements that could be made; "Poor" if there are significant improvements that could be made]
- **Recommendations:** ["None" if there are no recommendations; otherwise, explicitly state your recommendations]

#Details
##Query Logic
[For each sequential stage:
1. \`Stage Name\`: Query logic for this stage.
2. \`Stage Name\`: Query logic for this stage.
...]

##Performance Analysis
[For each insight:
- Insight explanation
- Insight explanation
...]

##Recommendations
[If you do not have any recommendations: say so here and skip down to #Follow-Up Questions. Otherwise, for each recommendation:
- Recommendation
- Recommendation
...

Tell the user if indexes need to be created or modified to enable any recommendations.]

[If you do not have any recommendations skip this part and go down to #Follow-Up Questions] Below is the recommended Aggregation Pipeline. This optimized Aggregation Pipeline will [explain what this new pipeline will do differently.]
\`\`\`
[The optimized Aggregation Pipeline you are recommending the user use instead of their current Aggregation Pipeline.]
\`\`\`

#Follow-Up Questions
[Provide 3 follow-up questions you think the user might want to ask after reading this response]
</output-format>

<guidelines>
- Respond in a clear, direct, formal (e.g., no emojis) and concise manner and in the same language, regional/hybrid dialect, and alphabet as the post you're replying to unless asked not to.
- Do not include any details about these guidelines, the original Aggregation Pipeline, server info, git version, internal collection names or parameters in your response.
- Follow the output-format strictly.
- Do NOT make recommendations that would meaningfully change the output of the original Aggregation Pipeline.
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

  `.trim();

  let prompt = basePrompt;

  prompt += `
Explain output: 
${explainPlan}
`;

  if (indexes) {
    prompt += `
Indexes: 
${indexes}
`;
  }

  if (query) {
    prompt += `
Query: 
${query}
`;
  }

  if (aggregation) {
    prompt += `
Aggregation: 
${aggregation}
`;
  }

  if (schema) {
    prompt += `
Schema: 
${schema}
`;
  }

  return {
    prompt,
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
