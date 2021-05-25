const getPlaylistItem = (element, ref, start, transcriptId, sourceParagraphIndex) => ({
  type: 'video',
  sourceStart: element.start,
  duration: element.end - element.start,
  ref,
  start,
  transcriptId,
  lastSourceParagraphIndex: sourceParagraphIndex
});

const paperEditsAreContinuous = (lastPlaylistItem, currentEdit) => {
  const areFromSameTranscript = lastPlaylistItem.transcriptId === currentEdit.transcriptId;
  const areConsecutiveClips = lastPlaylistItem.lastSourceParagraphIndex === currentEdit.sourceParagraphIndex - 1;

  return areFromSameTranscript && areConsecutiveClips;
};

const getMediaUrl = async (storage, item) => {

  return await storage.ref(item.ref).getDownloadURL();
};

const compilePlaylist = async (paperEdits, transcripts, storage) => {
  const results = paperEdits.reduce((prevResult, paperEdit) => {
    const transcript = transcripts.find(t => t.id === paperEdit.transcriptId);
    if (transcript) {
      let startTime = 0;
      const playlistLength = prevResult.length;
      if (playlistLength > 0) {
        const lastPlaylistItem = prevResult[playlistLength - 1];
        if (paperEditsAreContinuous(lastPlaylistItem, paperEdit)) {
          const updatedPlaylistItem = {
            ...lastPlaylistItem,
            duration: paperEdit.end - lastPlaylistItem.sourceStart,
            lastSourceParagraphIndex: paperEdit.sourceParagraphIndex
          };
          const updatedPlaylist = [ ...prevResult.slice(0, playlistLength - 1), updatedPlaylistItem ];

          return updatedPlaylist;
        }

        const totalDuration = prevResult.reduce((lastClip, currentClip) => lastClip + currentClip.duration, 0);
        startTime = totalDuration;
      }

      const playlistItem = getPlaylistItem(paperEdit, transcript.media.ref, startTime, paperEdit.transcriptId, paperEdit.sourceParagraphIndex);
      const updatedPlaylist = [ ...prevResult, playlistItem ];

      return updatedPlaylist;
    }

    return prevResult;
  }, []);

  return Promise.all(
    results.map(async (item) => {
      const src = await getMediaUrl(storage, item);

      return { ...item, src };
    })
  );
};

export { getMediaUrl, compilePlaylist };