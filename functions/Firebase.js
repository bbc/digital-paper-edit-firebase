const admin = require("firebase-admin");
const functions = require("firebase-functions");

class Firebase {
  constructor() {
    admin.initializeApp();
    this.firestoreDocRef = admin
      .firestore()
      .collection("apps")
      .doc("digital-paper-edit");

    this.functionsConfig = functions.config();
    this.storage = admin.storage;
    this.bucket = admin.storage().bucket(this.functionsConfig.storage.bucket);
    this.storageRef = admin.storage().ref();
  }

  getUserCollection = (uid, collection) =>
    this.firestoreDocRef.collection(`/users/${uid}/${collection}`);

  deleteFirestore = async (uid, id, folder) => {
    try {
      await this.getUserCollection(uid, folder)
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

  updateFirestore = async () => {
    await this.getUserCollection(uid, id, folder)
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

  downloadFile = async (name, filePath) => {
    const tmpFilePath = path.join(os.tmpdir(), name);
    await this.bucket.file(filePath).download({ destination: tmpFilePath });
    console.log("Image downloaded locally to", tmpFilePath);
    return tmpFilePath;
  };

  uploadFile = async (destPath, srcPath, metadata) => {
    await this.storageRef.child(destPath).put(srcPath, metadata);
  };
}

const instance = Firebase();
Object.freeze(instance);
export default instance;
