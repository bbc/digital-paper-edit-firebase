const getUrl = async srcFile => {
  try {
    console.log(`[START] Getting signed URL`);
    const sourceUrl = await srcFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 9 // 9 minutes
    });
    console.log(`[COMPLETE] Signed URL: ${sourceUrl}`);
    return sourceUrl;
  } catch (err) {
    console.error("[ERROR] Could not get signed URL: ", err);
    throw err;
  }
};

exports.getUrl = getUrl;
