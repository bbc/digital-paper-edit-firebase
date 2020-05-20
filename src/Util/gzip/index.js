import zlib from 'zlib';

const decompress = (compressed) => {
  console.time('decompressed');
  const buff = Buffer.from(compressed.toBase64(), 'base64');
  const decompBuff = zlib.gunzipSync(buff);
  const decompressed = JSON.parse(decompBuff.toString());
  console.timeEnd('decompressed');

  return decompressed;
};

const compress = (decompressed) => {
  console.time('compressed');
  const compressed = zlib.gzipSync(JSON.stringify(decompressed));
  console.timeEnd('compressed');

  return compressed;
};

export { decompress, compress };