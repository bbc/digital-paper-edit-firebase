export const LANDING = '/';
export const SIGN_IN = '/signin';
export const ADMIN = '/admin';
export const PROJECTS = '/projects';
export const WORKSPACE = '/projects/:projectId';
export const PAPER_EDITOR = '/projects/:projectId/paperedits/:papereditId';

// Same routes point to transcript editor for regression
// https://github.com/bbc/digital-paper-edit-firebase/pull/173
export const TRANSCRIPT_EDITOR =
  '/projects/:projectId/transcripts/:transcriptId';
export const TRANSCRIPT_EDITOR_CORRECT =
  '/projects/:projectId/transcripts/:transcriptId/correct';
// ============================================================

export const USERS = '/users';