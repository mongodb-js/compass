import parse from 'mongodb-query-parser';
import stringify from 'javascript-stringify';
import { ObjectId } from 'bson';

export default function createPipeline(text) {
  // Parse the text into array of text stages.
  // Generate the pipeline state from the array.
  const js = parse(text);
  return js.map((stage) => {
    return {
      id: new ObjectId().toHexString(),
      stageOperator: Object.keys(stage)[0],
      stage: stringify(Object.values(stage)[0], null, '  '),
      isValid: true,
      isEnabled: true,
      isExpanded: true,
      isLoading: false,
      isComplete: false,
      previewDocuments: [],
      syntaxError: null,
      error: null
    };
  });
}
