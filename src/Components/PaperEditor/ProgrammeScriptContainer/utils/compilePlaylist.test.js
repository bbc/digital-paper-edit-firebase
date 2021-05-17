import { compilePlaylist } from './compilePlaylist';

const mockPaperEdit = [
  {
    start: 13.39,
    end: 16.48,
    sourceParagraphIndex: 2,
    transcriptId: 'bEZalJJsaj86lKN76E63'
    // vcEnd: 3.09,
    // vcStart: 0
  },
  {
    start: 17.02,
    end: 20.55,
    sourceParagraphIndex: 3,
    transcriptId: 'bEZalJJsaj86lKN76E63'
    // vcEnd: 3.09,
    // vcStart: 0
  },
  {
    start: 29.83,
    end: 33.31,
    sourceParagraphIndex: 5,
    transcriptId: 'bEZalJJsaj86lKN76E63'
    // vcEnd: 3.09,
    // vcStart: 0
  },
  {
    start: 34.97,
    end: 38.66,
    sourceParagraphIndex: 6,
    transcriptId: 'bEZalJJsaj86lKN76E63'
    // vcEnd: 3.09,
    // vcStart: 0
  }
];

const mockTranscripts = [
  {
    id: 'bEZalJJsaj86lKN76E63',
    media: {
      ref: 'ZZZ'
    }
  }
];

const mockStorage = {
  ref: jest.fn(() => ({
    getDownloadURL: jest.fn().mockResolvedValue('some/download/url')
  }))
};

describe('compilePlaylist', () => {
  test('continuous clips from the same transcript are treated as one clip', async () => {
    const result = await compilePlaylist(mockPaperEdit, mockTranscripts, mockStorage);
    expect(result).toHaveLength(2);
    const clip1Duration = mockPaperEdit[1].end - mockPaperEdit[0].start;
    const clip2Duration = mockPaperEdit[3].end - mockPaperEdit[2].start;
    expect(result[0].duration).toEqual(clip1Duration);
    expect(result[1].duration).toEqual(clip2Duration);
  });
});