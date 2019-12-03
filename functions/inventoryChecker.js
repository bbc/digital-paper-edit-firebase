// watches storage for updates

// { bucket: 'newslabs-dev-aa20.appspot.com',
//   contentDisposition: 'inline; filename*=utf-8\'\'small.mp4',
//   contentType: 'video/mp4',
//   crc32c: 'lo9D5w==',
//   etag: 'CJDO4Kfyj+YCEAE=',
//   generation: '1575046732064528',
//   id: 'newslabs-dev-aa20.appspot.com/apps/digital-paper-edit/users/gLoKESQNkVavUfSiqqoSEEEa6Lo2/uploads/small.mp4/1575046732064528',
//   kind: 'storage#object',
//   md5Hash: 'o6x92rsmPC0Atz6Bd9FcjQ==',
//   mediaLink: 'https://www.googleapis.com/download/storage/v1/b/newslabs-dev-aa20.appspot.com/o/apps%2Fdigital-paper-edit%2Fusers%2FgLoKESQNkVavUfSiqqoSEEEa6Lo2%2Fuploads%2Fsmall.mp4?generation=1575046732064528&alt=media',
//   metadata:
//    { firebaseStorageDownloadTokens: 'b4c993d8-9b30-4a76-9be1-56a495b9eb73' },
//   metageneration: '1',
//   name: 'apps/digital-paper-edit/users/gLoKESQNkVavUfSiqqoSEEEa6Lo2/uploads/small.mp4',
//   selfLink: 'https://www.googleapis.com/storage/v1/b/newslabs-dev-aa20.appspot.com/o/apps%2Fdigital-paper-edit%2Fusers%2FgLoKESQNkVavUfSiqqoSEEEa6Lo2%2Fuploads%2Fsmall.mp4',
//   size: '383631',
//   storageClass: 'STANDARD',
//   timeCreated: '2019-11-29T16:58:52.064Z',
//   timeStorageClassUpdated: '2019-11-29T16:58:52.064Z',
//   updated: '2019-11-29T16:58:52.064Z' }

// const UserData = new Collection(props.firebase, `/users/${ uid }/uploads`);
// try {
// await UserData.deleteItem(id);
// } catch (e) {
// console.error('Failed to delete item for user: ', e.code_);
// }

// await UserData.setItem(newTranscript.id, {
// name: item.file.name,
// size: item.file.size,
// type: item.file.type
// });

exports.deleteHandler = async (object, db) => {
  console.log(object);
  console.log(db);
};

exports.finalizeHandler = async (object, db) => {
  console.log(object);
  console.log(db);
};
