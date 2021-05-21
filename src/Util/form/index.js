const initialFormState = {
  title: '',
  description: '',
  id: null
};

const formReducer = (state = initialFormState, props) => {
  const { type, payload } = props;
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

const incrementCopyName = (name, names) => {
  const words = name.split(' ');
  const lastWord = parseInt(words.pop());
  let newName = '';
  if (isNaN(lastWord)) {
    newName = `${ name } 1`;
  } else {
    newName = [ ...words, lastWord + 1 ].join(' ');
  }

  if (names.indexOf(newName) > -1) {
    return incrementCopyName(newName, names);
  } else {
    return newName;
  }
};

export { formReducer, initialFormState, incrementCopyName };