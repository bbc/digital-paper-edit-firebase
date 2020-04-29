const updateWordTimings = (newElements, oldIndex, newIndex) => {
  console.log('Inside update word timings');
  console.log('oldIndex: : ', oldIndex, 'newIndex: ', newIndex);

  // Makes sure all elements' index numbers are up to date
  const reindexedList = newElements.map((element, i) => {
    element.index = i;

    return element;
  });

  console.log('reindexed list: ', reindexedList);

  const updatedElementTimings = reindexedList.reduce((result, element) => {
    console.log('result', result);
    console.log('element', element);

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

const updateWordTimingsAfterDelete = () => {

};

const updateWordTimingsAfterInsert = () => {

};

export { updateWordTimings };