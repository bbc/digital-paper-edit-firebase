// Updates index numbers of programme script elements
const reindexList = (elements) => {
  const reindexedList = elements.map((element, i) => {
    element.index = i;

    return element;
  });

  return reindexedList;
};

const updateWordTimings = (elements) => {
  const reindexedList = reindexList(elements);
  const updatedElementTimings = reindexedList.reduce((result, element) => {

    // Re-calcultate word timings
    if (element.type === 'paper-cut') {
      const paperCut = JSON.parse(JSON.stringify(element));;
      const paperCutDuration = element.end - element.start;

      paperCut.words.map((word) => {
        const wordDuration = word.end - word.start;
        const wordStartTime = (word.start - paperCut.vcStart) + result.duration;
        const wordEndTime = wordStartTime + wordDuration;
        word.start = wordStartTime;
        word.end = wordEndTime;

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
  const reindexedList = reindexList(elements);
  const deletedElementDuration = reindexedList[index].end - elements[index].start;
  const updatedElements = reindexedList.slice(index, elements.length).filter((element) => element.type === 'paper-cut');;
  updatedElements.map((element) => {
    element.vcStart -= deletedElementDuration;
    element.vcEnd -= deletedElementDuration;
    element.words.map((word) => {
      word.start -= deletedElementDuration;
      word.end -= deletedElementDuration;
    });
    reindexedList[element.index] = element;
  });

  return reindexedList;
};

const updateWordTimingsAfterInsert = (elements, insertIndex) => {
  const newElement = elements[insertIndex]; // Insert index is where the new element was added
  const newPaperEditDuration = newElement.end - newElement.start;
  const reindexedList = reindexList(elements);
  // Only looks for paper-cuts in the programme script after the insertion point
  const elementsToUpdate = reindexedList.slice(insertIndex + 1, elements.length).filter((element) => element.type === 'paper-cut');;
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
  } else {
    console.log('No elements to update here');
  }

  return reindexedList;
};

export {
  updateWordTimings,
  updateWordTimingsAfterInsert,
  updateWordTimingsAfterDelete };