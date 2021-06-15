import { Document, HeadingLevel, AlignmentType, Paragraph, TextRun, Packer } from 'docx';
import { shortTimecode } from 'slate-transcript-editor';
import downloadjs from 'downloadjs';

const programmeScriptJsonToDocx = (edlJson, title, includeClipReference) => {
  const transcriptTitle = edlJson.title;

  const doc = new Document({
    sections: []
  });

  const sections = [];
  edlJson.events.forEach(event => {
    if (event.type === 'title') {
      sections.push(
        new Paragraph({
          text: event.text,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            after: 200,
          },
        })
      );
    } else if (event.type === 'voice-over') {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Voice Over:\t',
              italics: false,
              bold: true,
            }),
            new TextRun({
              text: `${ event.text }`,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );
    } else if (event.type === 'note') {
      sections.push(
        new Paragraph({
          children: [ new TextRun({ text: 'Notes:\t', italics: true, bold: true }), new TextRun({ text: `${ event.text }`, italics: true }) ],
          spacing: {
            after: 200,
          },
        })
      );
    } else if (event.type === 'paper-cut') {
      const text = event.words
        .map(word => {
          return word.text;
        })
        .join(' ');

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${ event.speaker }\t`,
              bold: true,
              allCaps: true,
            }),
            new TextRun({
              text: `${ text }`,
            }),
          ],
          spacing: {
            after: 100,
          },
        })
      );

      if (includeClipReference) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${ event.clipName }\t [${ shortTimecode(event.start) } - ${ shortTimecode(event.end) }]`,
                size: 18,
              }),
            ],
            spacing: {
              after: 200,
            },
          })
        );
      }
    }

    return null;
  });

  // Add transcription title
  doc.addSection({
    properties: {},
    children: [ new Paragraph({ text: transcriptTitle, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }), ...sections ],
  });

  return new Promise((resolve, reject) => {
    return Packer.toBlob(doc)
      .then(blob => {
        resolve(blob);
        downloadjs(blob, `${ title || 'example' }.docx`, 'application/msword');
        console.log('Document created successfully');
      })
      .catch(error => {
        reject(error);
      });
  });
};

export default programmeScriptJsonToDocx;