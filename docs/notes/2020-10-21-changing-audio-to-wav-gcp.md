Speech-to-Text supports `WAV` files with `LINEAR16` or `MULAW` encoded audio.

in fluent ffmpeg

```js
 .audioCodec("pcm_s16le")
      .audioChannels(1)
      .toFormat("wav")
      .audioFrequency(16000)
```
