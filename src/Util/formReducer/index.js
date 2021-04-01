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

const createOrUpdateItem = async (item, create, update) => {
  const updatedItem = { ...item };
  if (updatedItem.id) {
    update(updatedItem.id, updatedItem);

  } else {
    updatedItem = create(item);
  }

  return updatedItem;
};

const createCollectionItem = async (item, collection) => {
  const docRef = await collection.postItem(item);

  const update = {
    id: docRef.id,
    url: `${ collection.name }/${ docRef.id }`,
  };
  docRef.update(update);

  return { ...item, ...update };
};

const updateCollectionItem = (item, collection) => collection.putItem(item.id, item);

const updateItems = (item, items) => {
  const itemsToUpdate = [ ...items ];

  const updateItem = items.find(i => i.id === item.id);
  const updateIndex = items.indexOf(updateItem);

  itemsToUpdate[updateIndex] = { ...updateItem }.update(item);

  return itemsToUpdate;
};

const deleteCollectionItem = async (docId, collection) => {
  try {
    await collection.deleteItem(docId);
  } catch (e) {
    console.error('Failed to delete item:', e);
  }
};

export { formReducer, initialFormState, createOrUpdateItem, deleteCollectionItem, updateItems, updateCollectionItem, createCollectionItem };