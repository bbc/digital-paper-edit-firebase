const isAnnotationInWord = (annotation, word) => {
  const { start, end } = word;

  return (
    start >= annotation.start &&
        end <= annotation.end
  );
};

const wordsWithAnnotations = (words, annotations) => {

  return words.map((word) => {
    const annotation = annotations.find(anno => isAnnotationInWord(anno, word));
    if (annotation) {
      word.annotation = annotation;
    } else {
      // this is needed, for when an annotation is being removed from a word
      delete word.annotation;
    }

    return word;
  });

};

const paragraphWithAnnotations = (paragraphs, annotations) => {
  const newParagraphs = JSON.parse(JSON.stringify(paragraphs));

  return newParagraphs.map(paragraph => {
    paragraph.words = wordsWithAnnotations(paragraph.words, annotations);

    return paragraph;
  });
};

export default paragraphWithAnnotations;