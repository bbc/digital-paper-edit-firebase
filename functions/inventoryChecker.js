// watches storage for updates

const getUserCollection = (db, uid, collection) =>
  db.collection(`/users/${uid}/${collection}`);

exports.deleteHandler = async (object, db) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  try {
    await getUserCollection(db, uid, folder)
      .doc(id)
      .delete();
    console.log(`Deleting item ${id} for user ${uid} in ${folder}`);
  } catch (e) {
    console.error(
      `Failed to delete item ${id} for user ${uid} in ${folder}: `,
      e.code_
    );
  }
};

exports.finalizeHandler = async (object, db) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  await getUserCollection(db, uid, folder)
    .doc(id)
    .set({
      name: object.metadata.name,
      size: object.size,
      contentType: object.contentType,
      md5Hash: object.md5Hash,
      timeCreated: object.timeCreated
    });
  console.log(`Setting item ${id} for user ${uid} in ${folder}`);
};
