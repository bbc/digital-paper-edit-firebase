exports.deleteHandler = async (object, firebase) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  firebase.deleteFirestore(db, uid, id, folder);
};

exports.finalizeHandler = async (object, firebase) => {
  const metadata = object.metadata;
  const uid = metadata.userId;
  const id = metadata.id;
  const folder = metadata.folder;
  firebase.updateFirestore(uid, id, folder);
};
