import zlib from 'zlib';
import util from 'util';
const decompress = (compressed) => {
  console.time('decompressed');
  const buff = Buffer.from(compressed.toBase64(), 'base64');
  const decompBuff = zlib.gunzipSync(buff);
  const decompressed = JSON.parse(decompBuff.toString());
  console.timeEnd('decompressed');

  return decompressed;
};

const gunzip = util.promisify(zlib.gunzip);

const decompressAsync = async (compressed) => {
  console.time('decompressed');
  const buff = Buffer.from(compressed.toBase64(), 'base64');
  const dbuff = await gunzip(buff);
  const decomp = JSON.parse(dbuff.toString());
  console.timeEnd('decompressed');

  return decomp;
};

const compress = (decompressed) => {
  console.time('compressed');
  const compressed = zlib.gzipSync(JSON.stringify(decompressed));
  console.timeEnd('compressed');

  return compressed;
};

export { decompress, compress, decompressAsync };