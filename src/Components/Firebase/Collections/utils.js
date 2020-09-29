/**
 * @param {{ get: () => any; }} collection
 */
const getDocs = async (collection) => {
  const collectionRef = await collection.get();
  const /**
     * @param {{ data: () => any; id: string; }} doc
     */
    data = collectionRef.docs.map((doc) => {
      return { ...doc.data(), id: doc.id, display: true };
    });

  // const sorted = data.sort((a, b) => {
  //   const updatedA = a.updated ? a.updated.seconds : 0;
  //   const updatedB = b.updated ? b.updated.seconds : 0;
  //   // b.updated.seconds - a.updated.seconds;

  //   return updatedB - updatedA;
  // });

  // const dict = sorted.reduce((dict, el) => (dict[el.id] = el, dict), {});

  return data;
};

/**
 * @param {any} firebase
 * @param {string} base
 * @param {string} sub
 */
const getSubCollections = async (firebase, base, sub) => {
  const collection = new Collection(firebase, `${ base }/${ sub }`);

  return await getDocs(collection.collectionRef);
};

export { getSubCollections, getDocs };