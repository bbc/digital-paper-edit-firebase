const getUrl = async (srcFile) => {
  try {
    console.log(`[START] Getting signed URL`);
    const sourceUrl = await srcFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 9, // 9 minutes
    });
    console.log(`[COMPLETE] Signed URL: ${sourceUrl}`);
    return sourceUrl;
  } catch (err) {
    console.error("[ERROR] Could not get signed URL: ", err);
    throw err;
  }
};

const secondsToDhms = (seconds) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
};

const getMetadata = (snap) => {
  const durationSeconds = Math.ceil(snap.data().duration);
  return {
    duration: `${durationSeconds}`,
  };
};

exports.getUrl = getUrl;
exports.secondsToDhms = secondsToDhms;
exports.getMetadata = getMetadata;
