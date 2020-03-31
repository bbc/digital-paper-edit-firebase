const getUserCollection = (admin, uid, collection) => {
  return admin
    .firestore()
    .collection(`apps/digital-paper-edit/users/${uid}/${collection}`);
};

const deleteFirestore = async (admin, object) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;

  console.log(`[START] Deleting item ${id} for user ${uid} in ${folder}`);

  try {
    await getUserCollection(admin, uid, folder)
      .doc(id)
      .delete();
    console.log(`[COMPLETE] Deleted item ${id} for user ${uid} in ${folder}`);
  } catch (e) {
    console.error(
      `[ERROR] Failed to delete item ${id} for user ${uid} in ${folder}: `,
      e
    );
  }
};

const updateFirestore = async (admin, object) => {
  const uid = object.metadata.userId;
  const id = object.metadata.id;
  const folder = object.metadata.folder;
  const originalName = object.metadata.originalName
    ? object.metadata.originalName
    : "";
  const duration = object.metadata.duration ? object.metadata.duration : 0;

  const update = {
    originalName: originalName,
    size: object.size,
    contentType: object.contentType,
    md5Hash: object.md5Hash,
    timeCreated: object.timeCreated,
    duration: duration
  };

  console.log(
    `[START] Setting item ${id} for user ${uid} in ${folder} with: ${JSON.stringify(
      update
    )}`
  );
  try {
    await getUserCollection(admin, uid, folder)
      .doc(id)
      .set(update);
    console.log(`[COMPLETE] Set item ${id} for user ${uid} in ${folder}`);
  } catch (e) {
    console.error(
      `[ERROR] Failed to set item ${id} for user ${uid} in ${folder}: `,
      e
    );
  }
};

exports.deleteHandler = async (object, admin) => {
  await deleteFirestore(admin, object);
};

exports.finalizeHandler = async (object, admin) => {
  await updateFirestore(admin, object);
};
