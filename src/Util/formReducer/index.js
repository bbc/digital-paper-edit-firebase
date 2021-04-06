const initialFormState = {
  title: '',
  description: '',
  id: null
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

const createOrUpdateCollectionItem = async (item, create, update) => {
  const updatedItem = { ...item };

  if (!updatedItem.id) {
    updatedItem.url = '';
    updatedItem = await create(item);
  } else {
    await update(updatedItem);
  }

  return updatedItem;
};

const createCollectionItem = async (item, collection) => {
  const docRef = await collection.postItem(item);

  const update = {
    id: docRef.id,
    url: `${ collection.name }/${ docRef.id }`,
  };

  await docRef.update(update);

  return { ...item, ...update };
};

const updateCollectionItem = async (item, collection) => {
  await collection.putItem(item.id, item);

  return item;
};

const updateItems = (item, items) => {
  const itemsToUpdate = [ ...items ];
  const updateItem = items.find(i => i.id === item.id);
  const updateIndex = items.indexOf(updateItem);
  itemsToUpdate[updateIndex] = item;

  return itemsToUpdate;
};

const deleteCollectionItem = async (docId, collection) => {
  try {
    await collection.deleteItem(docId);
  } catch (e) {
    console.error('Failed to delete item:', e);
  }
};

const handleDeleteItem = (item, deleteFn) => {
  deleteFn(item);
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

const handleDuplicateItem = (item, createFn) => {
  createFn(item);
};

export { formReducer, initialFormState,
  deleteCollectionItem, handleDeleteItem, handleDuplicateItem,
  updateItems, updateCollectionItem, createCollectionItem,
  createOrUpdateCollectionItem, incrementCopyName };