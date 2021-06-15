'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = void 0;

var _docx = require('docx');

var _slateTranscriptEditor = require('slate-transcript-editor');

var _downloadjs = _interopRequireDefault(require('downloadjs'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var programmeScriptJsonToDocx = function programmeScriptJsonToDocx(edlJson, title, includeClipReference) {
  var transcriptTitle = edlJson.title;
  var doc = new _docx.Document({
    sections: []
  });
  var sections = [];
  edlJson.events.forEach(function (event) {
    if (event.type === 'title') {
      sections.push(new _docx.Paragraph({
        text: event.text,
        heading: _docx.HeadingLevel.HEADING_1,
        spacing: {
          after: 200
        }
      }));
    } else if (event.type === 'voice-over') {
      sections.push(new _docx.Paragraph({
        children: [ new _docx.TextRun({
          text: 'Voice Over:\t',
          italics: false,
          bold: true
        }), new _docx.TextRun({
          text: ''.concat(event.text)
        }) ],
        spacing: {
          after: 200
        }
      }));
    } else if (event.type === 'note') {
      sections.push(new _docx.Paragraph({
        children: [ new _docx.TextRun({
          text: 'Notes:\t',
          italics: true,
          bold: true
        }), new _docx.TextRun({
          text: ''.concat(event.text),
          italics: true
        }) ],
        spacing: {
          after: 200
        }
      }));
    } else if (event.type === 'paper-cut') {
      var text = event.words.map(function (word) {
        return word.text;
      }).join(' ');
      sections.push(new _docx.Paragraph({
        children: [ new _docx.TextRun({
          text: ''.concat(event.speaker, '\t'),
          bold: true,
          allCaps: true
        }), new _docx.TextRun({
          text: ''.concat(text)
        }) ],
        spacing: {
          after: 100
        }
      }));

      if (includeClipReference) {
        sections.push(new _docx.Paragraph({
          children: [ new _docx.TextRun({
            text: ''.concat(event.clipName, '\t [').concat((0, _slateTranscriptEditor.shortTimecode)(event.start), ' - ').concat((0, _slateTranscriptEditor.shortTimecode)(event.end), ']'),
            size: 18
          }) ],
          spacing: {
            after: 200
          }
        }));
      }
    }

    return null;
  }); // Add transcription title

  doc.addSection({
    properties: {},
    children: [ new _docx.Paragraph({
      text: transcriptTitle,
      heading: _docx.HeadingLevel.TITLE,
      alignment: _docx.AlignmentType.CENTER
    }) ].concat(sections)
  });

  return new Promise(function (resolve, reject) {
    return _docx.Packer.toBlob(doc).then(function (blob) {
      resolve(blob);
      (0, _downloadjs['default'])(blob, ''.concat(title || 'example', '.docx'), 'application/msword');
      console.log('Document created successfully');
    })['catch'](function (error) {
      reject(error);
    });
  });
};

var _default = programmeScriptJsonToDocx;
exports['default'] = _default;