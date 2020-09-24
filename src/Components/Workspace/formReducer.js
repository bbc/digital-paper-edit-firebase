const initialFormState = {
  title: '',
  description: '',
  id: null,
};

const formReducer = (state = initialFormState, { type, payload }) => {
  switch (type) {
  case 'update':
    return { ...state, ...payload };
  case 'reset': {
    return { initialFormState };
  }
  default:
    return state;
  }
};

export { formReducer, initialFormState };