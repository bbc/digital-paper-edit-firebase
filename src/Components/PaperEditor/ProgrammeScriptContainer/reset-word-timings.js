const reindexList = (newElements) => {
  return (
    newElements.map((element, i) => {
      element.index = i;

      return element;
    })
  );
};

const updateWordTimings = (newElements, oldIndex, newIndex) => {
  console.log('Inside update word timings');
  console.log('oldIndex: : ', oldIndex, 'newIndex: ', newIndex);

  // Makes sure all elements' index numbers are up to date
  const reindexedList = reindexList(newElements);

  const updatedElementTimings = reindexedList.reduce((result, element) => {

    // If the element index falls within the reorder, recalcultate word timings
    if (element.type === 'paper-cut') {
      const paperCut = element;
      const paperCutDuration = element.end - element.start;

      // Adjusts word timings for paper-cut elements
      paperCut.words.map((word) => {
        const wordDuration = word.end - word.start;
        const newStartTime = (word.start - paperCut.vcStart) + result.duration;
        const newEndTime = newStartTime + wordDuration;
        word.start = newStartTime;
        word.end = newEndTime;

        return word;
      });

      // Adjusts paper-cut video context start and end times
      paperCut.vcStart = result.duration;
      paperCut.vcEnd = result.duration + paperCutDuration;

      // Adds the length of the element to the duration counter
      result.duration += paperCutDuration;

      // Adds the newly calcultaed elemnt to the element list
      result.elements.push(paperCut);

      return result;

    } else {

      // If an element isn't a paper-cut, push it directly to the elements list.
      result.elements.push(element);

      return result;
    }

  }, { duration: 0, elements: [] });

  return updatedElementTimings.elements;
};

const updateWordTimingsAfterDelete = (elements, index) => {
  const elementsClone = elements;
  const deletedElementDuration = elementsClone[index].end - elements[index].start;
  const updatedElements = elementsClone.slice(index + 1, elements.length).filter((element) => element.type === 'paper-cut');;
  updatedElements.map((element) => {
    element.vcStart -= deletedElementDuration;
    element.vcEnd -= deletedElementDuration;
    element.words.map((word) => {
      word.start -= deletedElementDuration;
      word.end -= deletedElementDuration;
    });
    elementsClone[element.index] = element;
  });

  return elementsClone;
};

const updateWordTimingsAfterInsert = (newElements, insertIndex) => {
  const newElement = newElements[insertIndex]; // Insert index is where the new element was added
  const newPaperEditDuration = newElement.end - newElement.start;

  // Makes sure all elements' index numbers are up to date
  const reindexedList = reindexList(newElements);

  // Only looks for paper-cuts in the programme script after the insertion point
  const elementsToUpdate = reindexedList.slice(insertIndex + 1, newElements.length).filter((element) => element.type === 'paper-cut');;
  if (elementsToUpdate) {
    elementsToUpdate.map((element) => {

      // Updates video context start and end times by length of insertion
      element.vcStart += newPaperEditDuration;
      element.vcEnd += newPaperEditDuration;
      // Adds the length of the newly inserted paper-cut element to all word timings in subsequent paper-cuts
      element.words.map((word) => {
        word.start += newPaperEditDuration;
        word.end += newPaperEditDuration;
      });

      // Updates the word timings in the reindexed list
      reindexedList[element.index] = element;
    });
    console.log('reindexed list', reindexedList);
  } else {
    console.log('No elements to update here');
  }

  return reindexedList;
};

export {
  updateWordTimings,
  updateWordTimingsAfterInsert,
  updateWordTimingsAfterDelete };