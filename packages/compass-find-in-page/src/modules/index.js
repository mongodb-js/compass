export const TOGGLE_STATUS = 'TOGGLE_STATUS';

export const INITIAL_STATE = {
  enabled: false
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_STATUS) return { ...state, enabled: state.enabled === true ? false : true };

  return state;
}

export const toggleStatus = () => ({
  type: TOGGLE_STATUS
});
