import zlib from 'zlib';

const gunzip = (compressed) => {
  const buff = Buffer.from(compressed.toBase64(), 'base64');
  const decompBuff = zlib.gunzipSync(buff);

  return JSON.parse(decompBuff.toString());
};

export default gunzip;