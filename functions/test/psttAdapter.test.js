const assert = require("assert");
const psttAdapter = require("../sttChecker/psttAdapter");

const { items, transcript } = require("../examples/output/psttBBCShort.json");

describe("psttAdapter", () => {
  const { words, paragraphs, grouped } = psttAdapter(items);
  it("should have generated the same text as source STT", () => {
    const text = words.map((w) => w.text).join(" ");
    assert.equal(text, transcript);
  });

  it("should have generated metadata for paragraphs", () => {
    let paragraph = paragraphs[0];
    let expected = { end: 275.94, id: 0, speaker: "TBC - 0", start: 269.63 };

    assert.equal(paragraph.id, expected.id);
    assert.equal(paragraph.speaker, expected.speaker);
    assert.equal(paragraph.end, expected.end);
    assert.equal(paragraph.start, expected.start);

    paragraph = paragraphs[1];
    expected = {
      id: 1,
      start: 276.27,
      end: 283.99,
      speaker: "TBC - 1",
    };
    assert.equal(paragraph.id, expected.id);
    assert.equal(paragraph.speaker, expected.speaker);
    assert.equal(paragraph.end, expected.end);
    assert.equal(paragraph.start, expected.start);

    paragraph = paragraphs[2];
    expected = {
      id: 2,
      start: 284.74,
      end: 291.93,
      speaker: "TBC - 2",
    };
    assert.equal(paragraph.id, expected.id);
    assert.equal(paragraph.speaker, expected.speaker);
    assert.equal(paragraph.end, expected.end);
    assert.equal(paragraph.start, expected.start);
  });

  it("should have generated words for transcription", () => {
    const expectedWords = [
      {
        end: 269.76,
        id: 0,
        start: 269.63,
        text: "The",
      },
      {
        end: 269.98,
        id: 1,
        start: 269.76,
        text: "Royal",
      },
      {
        end: 270.37,
        id: 2,
        start: 269.98,
        text: "British",
      },
      {
        end: 270.71,
        id: 3,
        start: 270.37,
        text: "Legion",
      },
      {
        end: 270.84,
        id: 4,
        start: 270.71,
        text: "will",
      },
      {
        end: 271.14,
        id: 5,
        start: 270.84,
        text: "host",
      },
      {
        end: 272.19,
        id: 6,
        start: 271.14,
        text: "750",
      },
      {
        end: 272.74,
        id: 7,
        start: 272.19,
        text: "veterans,",
      },
      {
        end: 273.42,
        id: 8,
        start: 272.74,
        text: "descendants,",
      },
      {
        end: 274.17,
        id: 9,
        start: 273.42,
        text: "evacuees",
      },
      {
        end: 274.31,
        id: 10,
        start: 274.17,
        text: "and",
      },
      {
        end: 274.56,
        id: 11,
        start: 274.31,
        text: "those",
      },
      {
        end: 274.71,
        id: 12,
        start: 274.56,
        text: "who",
      },
      {
        end: 275.14,
        id: 13,
        start: 274.71,
        text: "served",
      },
      {
        end: 275.22,
        id: 14,
        start: 275.14,
        text: "on",
      },
      {
        end: 275.3,
        id: 15,
        start: 275.22,
        text: "the",
      },
      {
        end: 275.53,
        id: 16,
        start: 275.3,
        text: "home",
      },
      {
        end: 275.94,
        id: 17,
        start: 275.53,
        text: "front.",
      },
    ];
    expectedWords.forEach((expectedWord, index) => {
      const actualWord = words[index];
      assert.equal(expectedWord.end, actualWord.end);
      assert.equal(expectedWord.id, actualWord.id);
      assert.equal(expectedWord.start, actualWord.start);
      assert.equal(expectedWord.text, actualWord.text);
    });
  });

  it("should have generated grouped words in paragraphs for transcription", () => {
    const expectedSpeaker = "TBC - 0";
    const expectedText =
      "The Royal British Legion will host 750 veterans, descendants, evacuees and those who served on the home front.";
    assert.equal(expectedText, grouped[0].text);
    assert.equal(expectedSpeaker, grouped[0].speaker);
  });
});
