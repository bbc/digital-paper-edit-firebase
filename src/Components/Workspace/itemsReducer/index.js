const updateItems = (id, items, item) => {
  const elementsIndex = items.findIndex(element => element.id === id );
  const newItem = { ...items[elementsIndex], ...item };
  const newArray = [ ...items ];
  newArray[elementsIndex] = newItem;
  console.log('updating', newArray);

  return newArray;
};

const deleteItem = (id, items) => {
  return items.filter(item => id !== item.id);
};

const addItem = (items, item) => {
  return [ item, ...items ];
};

function itemsInit(items) {
  return items;
}

const itemsInitState = [];

function itemsReducer(items, action) {
  switch (action.type) {
  case 'add':
    return addItem(items, action.payload.item) ;
  case 'delete':
    return deleteItem(action.payload.id, items) ;
  case 'update':
    return updateItems(
      action.payload.id,
      items,
      action.payload.update
    );
  case 'set':
    return itemsInit(action.payload);
  default:
    throw new Error();
  }
}

export { addItem, deleteItem, updateItems, itemsReducer, itemsInit, itemsInitState };