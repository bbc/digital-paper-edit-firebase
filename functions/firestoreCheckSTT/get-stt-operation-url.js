exports.getSttOperationUrl = (operationName, firebaseApiKey) => {
  return `https://speech.googleapis.com/v1/operations/${operationName}?key=${firebaseApiKey}`;
};
