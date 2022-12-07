const SET_IS_DATA_LAKE = `explain/is-datalake/SET_IS_DATA_LAKE`;

export const INITIAL_STATE = false;

const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SET_IS_DATA_LAKE) {
    return action.isDataLake;
  }
  return state;
};

export default reducer;

export const setIsDataLake = (isDataLake) => ({
  type: SET_IS_DATA_LAKE,
  isDataLake,
});
