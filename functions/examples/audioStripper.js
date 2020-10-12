const fs = require("fs");
// const { convertStreamToAudio } = require("@bbc/convert-to-audio");

const asyncWorkingExamples = async () => {
  /*
  Cannot use MP4 stream as a source unless it is an URL
  https://stackoverflow.com/questions/23002316/ffmpeg-pipe0-could-not-find-codec-parameters/40028894#40028894
   */

  const urlInput =
    "https://pc.tedcdn.com/talk/stream/2018S/Blank/KateDarling_2018S-950k.mp4";

  let outPath = `./output/url.wav`;
  let outStream = fs.createWriteStream(outPath);

  await convertStreamToAudio(urlInput, outStream);

  const inputFile = `./input/sample_audio_input.wav`;
  const inputStream = fs.createReadStream(inputFile);

  outPath = `./output/stream.wav`;
  outStream = fs.createWriteStream(outPath);

  await convertStreamToAudio(inputStream, outStream);
};

asyncWorkingExamples();
