const getUserCollection = (admin, uid, collection) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${uid}/${collection}`);
};

const deleteFirestore = async (admin, uid, id, folder) => {
  try {
    await getUserCollection(admin, uid, folder)
      .doc(id)
      .delete();
    console.log(`Deleting item ${id} for user ${uid} in ${folder}`);
  } catch (e) {
    console.error(
      `Failed to delete item ${id} for user ${uid} in ${folder}= `,
      e.code_
    );
  }
};

const updateFirestore = async (admin, uid, id, folder) => {
  await getUserCollection(admin, uid, folder)
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

exports.deleteHandler = async (object, admin) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  deleteFirestore(admin, uid, id, folder);
};

exports.finalizeHandler = async (object, admin) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  updateFirestore(admin, uid, id, folder);
};
