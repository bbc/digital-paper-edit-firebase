const punctuateWords = (items) => {
  const words = JSON.parse(JSON.stringify(items));

  words
    .filter((word) => word.type === "punct")
    .forEach((punct) => {
      const punctIndex = words.indexOf(punct);
      const previousWordIndex = punctIndex - 1;

      // take out previousWord and punct from words
      const previousWord = words.splice(previousWordIndex, 2)[0];
      previousWord.alternatives[0].content += punct.alternatives[0].content;

      // reinsert previousWord
      words.splice(previousWordIndex, 0, previousWord);
    });

  return words;
};

const formatWord = (word) => {
  return {
    start: parseFloat(word.start),
    end: parseFloat(word.end),
    text: word.alternatives[0].content,
  };
};

const generateParagraph = (items, index) => {
  const words = punctuateWords(items).map((item) => formatWord(item));

  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  return {
    id: index,
    start: parseFloat(firstWord.start),
    end: parseFloat(lastWord.end),
    speaker: `TBC - ${index}`,
    words: words,
    text: words.map((w) => w.text).join(' '),
  };
};

const getSentences = (items) => {
  const fullStopIndices = items
    .filter(
      (item) => item.type === "punct" && item.alternatives[0].content === "."
    )
    .map((item) => items.indexOf(item));

  const { sentences } = fullStopIndices.reduce(
    (accumulator, fullStopIndex) => {
      const startWordIndex = accumulator.startWordIndex;
      const endWordIndex = fullStopIndex + 1;

      accumulator.sentences.push(items.slice(startWordIndex, endWordIndex));
      accumulator.startWordIndex = endWordIndex;
      return accumulator;
    },
    { sentences: [], startWordIndex: 0 }
  );
  return sentences;
};

const psttTranscriptAdapter = (psttTranscript) => {
  const sentences = getSentences(psttTranscript);
  return sentences.reduce(
    (transcript, sentence, i) => {
      const grouped = generateParagraph(sentence, i)
      transcript.grouped.push(grouped)
      const { words, ...paragraph } = grouped
      words.forEach((w, i) => (w.id = i + transcript.words.length));
      transcript.words = transcript.words.concat(words);
      transcript.paragraphs.push(paragraph);
      return transcript;
    },
    { paragraphs: [], words: [], grouped: [] }
  );
};

module.exports = psttTranscriptAdapter;
