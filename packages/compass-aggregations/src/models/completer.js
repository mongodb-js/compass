/**
 * The stage operators.
 */
const STAGE_OPERATORS = [
  {
    name: '$match',
    value: '$match',
    score: 1,
    meta: ''
  }
];

class Completer {
  getCompletions(editor, session, pos, prefix, callback) {
    console.log(editor);
    console.log(session);
    console.log(pos);
    console.log(prefix);
    callback(null, STAGE_OPERATORS);
  }
}

export default Completer;
export { Completer };
