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

const getMediaUrl = async (storage, item) => storage.ref(item.ref).getDownloadURL();

const compilePlaylist = async (paperEdits, transcripts, storage) => {
  //todo: extract startTime into a let?
  const emptyPlaylist = { startTime: 0, playlist: [] };
  const results = paperEdits.reduce((prevResult, paperEdit) => {
    const transcript = transcripts.find(t => t.id === paperEdit.transcriptId);
    if (transcript) {
      if (prevResult.playlist.length > 0) {
        const lastPlaylistItem = prevResult.playlist[prevResult.playlist.length - 1];
        if (paperEditsAreContinuous(lastPlaylistItem, paperEdit)) {
          const updatedPlaylistItem = {
            ...lastPlaylistItem,
            duration: paperEdit.end - lastPlaylistItem.sourceStart,
            lastSourceParagraphIndex: paperEdit.sourceParagraphIndex
          };
          const updatedStartTime = prevResult.startTime + updatedPlaylistItem.duration;
          const updatedPlaylist = [ ...prevResult.playlist.slice(0, prevResult.playlist.length - 1), updatedPlaylistItem ];

          return { startTime: updatedStartTime, playlist: updatedPlaylist };
        }
      }
      //Todo fix this line - srtatTime not correct?
      const playlistItem = getPlaylistItem(paperEdit, transcript.media.ref, prevResult.startTime, paperEdit.transcriptId, paperEdit.sourceParagraphIndex);
      const updatedPlaylist = [ ...prevResult.playlist, playlistItem ];
      const updatedStartTime = prevResult.startTime + playlistItem.duration;

      return { startTime: updatedStartTime, playlist: updatedPlaylist };
    }

    return prevResult;
  }, emptyPlaylist);

  return Promise.all(
    results.playlist.map(async (item) => {
      const src = await getMediaUrl(storage, item);

      return { ...item, src };
    })
  );
};

export { compilePlaylist };