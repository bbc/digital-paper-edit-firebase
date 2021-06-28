'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getADLSq = exports.getEDLSq = void 0;

var _aes31AdlComposer = _interopRequireDefault(require('@bbc/aes31-adl-composer'));

var _helper = require('./helper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError('Invalid attempt to spread non-iterable instance'); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === '[object Arguments]') return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; }

  return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); }

  return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } }

  return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; }

  return obj; }

var formatToEDLEvent = function formatToEDLEvent(transcript, element, index) {
  var result = {
    id: index,
    startTime: element.start,
    endTime: element.end,
    reelName: transcript.metadata ? transcript.metadata.reelName : _helper.defaultReelName,
    clipName: ''.concat(encodeURIComponent(transcript.title)),
    // TODO: frameRate should be pulled from the clips in the sequence
    // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
    // but again frameRate should not be hard coded
    fps: transcript.metadata ? transcript.metadata.fps : _helper.defaultFps,
    // TODO: if there is an offset this should added here, for now hard coding 0
    offset: transcript.metadata ? transcript.metadata.timecode : _helper.defaultTimecodeOffset,
    sampleRate: transcript.metadata ? transcript.metadata.sampleRate : _helper.defaultSampleRate
  };

  return result;
};

var mergeConsecutiveElements = function mergeConsecutiveElements(elements) {
  var paperCuts = elements.filter(function (element) {
    return element.type === 'paper-cut';
  });

  return paperCuts.reduce(function (accumulator, currentElement) {
    if (accumulator.length > 0) {
      var prevElement = accumulator[accumulator.length - 1];
      var areElementsConsecutive = currentElement.transcriptId === prevElement.transcriptId && prevElement.end === currentElement.start;

      if (areElementsConsecutive) {
        var mergedElement = _objectSpread({}, prevElement, {
          end: currentElement.end
        });

        return [].concat(_toConsumableArray(accumulator.slice(0, accumulator.length - 1)), [ mergedElement ]);
      } else {
        return [].concat(_toConsumableArray(accumulator), [ currentElement ]);
      }
    }

    return [].concat(_toConsumableArray(accumulator), [ currentElement ]);
  }, []);
};

var getEDLSq = function getEDLSq(title, elements, transcripts) {
  var mergedElements = mergeConsecutiveElements(elements);

  return mergedElements.reduce(function (res, element) {
    var transcript = (0, _helper.getCurrentTranscript)(element, transcripts);
    var edlEvent = formatToEDLEvent(transcript, element, res.index + 1);

    return _objectSpread({}, res, {
      events: [].concat(_toConsumableArray(res.events), [ edlEvent ])
    });
  }, {
    title: title,
    events: [],
    index: 0
  });
};

exports.getEDLSq = getEDLSq;

var formatToADLEvent = function formatToADLEvent(transcript, element) {
  var result = {
    start: element.start,
    end: element.end,
    reelName: transcript.title ? transcript.title : _helper.defaultReelName,
    clipName: transcript.fileName,
    // TODO: frameRate should be pulled from the clips in the sequence
    // Changing to 24 fps because that is the frame rate of the ted talk examples from youtube
    // but again frameRate should not be hard coded
    fps: transcript.metadata ? transcript.metadata.fps : _helper.defaultFps,
    // TODO: if there is an offset this should added here, for now hard coding 0
    offset: transcript.metadata ? transcript.metadata.timecode : _helper.defaultTimecodeOffset,
    sampleRate: transcript.metadata ? transcript.metadata.sampleRate : _helper.defaultSampleRate,
    label: '',
    uuid: transcript.uuid,
    path: transcript.path
  };

  return result;
};

var getADLSq = function getADLSq(projectTitle, title, elements, transcripts) {
  var mergedElements = mergeConsecutiveElements(elements);
  var edits = mergedElements.filter(function (el) {
    return el.type === 'paper-cut';
  }).map(function (element, index) {
    var transcript = (0, _helper.getCurrentTranscript)(element, transcripts);
    var edit = formatToADLEvent(transcript, element);
    edit.id = index + 1;

    return edit;
  });
  var result = (0, _aes31AdlComposer['default'])({
    projectOriginator: 'Digital Paper Edit',
    // TODO: it be good to change sequence for the ADL to be same schema
    // as the one for EDL and FCPX - for now just adjusting
    edits: edits,
    sampleRate: 48000,
    // should be 48000 default
    frameRate: 25,
    projectName: ''.concat(projectTitle, '-').concat(title)
  });

  return result;
}; // https://www.npmjs.com/package/downloadjs
// https://www.npmjs.com/package/edl_composer

exports.getADLSq = getADLSq;