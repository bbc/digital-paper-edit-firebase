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
  const updatedDoc = await docRef.get();

  return updatedDoc.data();
};

const updateCollectionItem = async (item, collection) => {
  await collection.putItem(item.id, item);

  return item;
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

const handleDuplicateItem = (item, createFn) => {
  createFn(item);
};

const updateItems = (item, items) => {
  const itemsToUpdate = [ ...items ];
  const updateItem = items.find(i => i.id === item.id);
  const updateIndex = items.indexOf(updateItem);
  itemsToUpdate[updateIndex] = item;

  return itemsToUpdate;
};

export {
  deleteCollectionItem, handleDeleteItem, handleDuplicateItem,
  updateCollectionItem, createCollectionItem,
  createOrUpdateCollectionItem, updateItems };