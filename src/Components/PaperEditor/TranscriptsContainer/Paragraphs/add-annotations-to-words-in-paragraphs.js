const isAnnotationInWord = (annotation, word) => {
  const { start, end } = word;

  return (
    start >= annotation.start &&
        end <= annotation.end
  );
};

const wordsWithAnnotations = (words, annotations) => {

  if (annotations) {
    return words.map((word) => {
      const annotation = annotations.find(anno => isAnnotationInWord(anno, word));
      if (annotation) {
        word.annotation = annotation;
      } else {
        delete word.annotation;
      }

      return word;
    });
  }

};

const paragraphWithAnnotations = (paragraphs, annotations) => {
  const newParagraphs = JSON.parse(JSON.stringify(paragraphs));

  return newParagraphs.map(paragraph => {
    paragraph.words = wordsWithAnnotations(paragraph.words, annotations);

    return paragraph;
  });
};

export default paragraphWithAnnotations;