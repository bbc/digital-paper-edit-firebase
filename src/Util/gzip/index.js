import zlib from 'zlib';

const decompress = (compressed) => {
  console.log('decompressed');
  const buff = Buffer.from(compressed.toBase64(), 'base64');
  const decompBuff = zlib.gunzipSync(buff);

  return JSON.parse(decompBuff.toString());
};

const compress = (decompressed) => {
  console.log('compressed');

  return zlib.gzipSync(JSON.stringify(decompressed));
};

export { decompress, compress };