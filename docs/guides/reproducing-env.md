# Reproducing Firestore and GCP setup for a new environment

Before Eimi left the project, we manually set up a PROD version of our Firebase app that replicated our DEV site. This isn't a comprehensive guide to that process, but a collection of some of the debugging activities we performed to get the site working after the initial setup. 

_Note: Most of these issues occur within the GCP console and not Firebase; the initial Firebase work we paired on mainly involved comparing the setups of the storage, hosting and Firestore resources on Dev and replicating them manually on Prod._ 

## Service account not given proper permissions
Linked issue: [#226](https://github.com/bbc/digital-paper-edit-firebase/issues/226)

### Symptoms:
- All transcription jobs were stuck in the 'Stripping audio...' phase
- The dpeOnCreateFirestoreUploadStripAudio function returned a log: `Error: Could not get signed URL: { Error: IAM Service Account API Credentials have not been used in project before or it is disabled }` 
- The files themselves were not being uploaded to storage at all

### Solution:
- Log into your GCP console and the project dashboard. On the left-hand menu, navigate to `IAM`. 
- I debugged by comparing the tables on PROD and DEV, sorted by roles. I noticed some discrepancies between the two, and manually modified permissions for roles where the permissions did not match. In this case, I believe the main problem was that our app's service account hadn't been given service account token creator permissions.

## Storage bucket not updated with CORS policy
Linked issue: [#232](https://github.com/bbc/digital-paper-edit-firebase/issues/232)

### Symptoms: 
- The PreviewCanvas on our new site did not play back any media files
- Console errors:
  - `Access to video ... has been blocked by CORS policy`
  - `Error with element <video..../>`

![Screenshot of console errors described above](https://user-images.githubusercontent.com/4565059/117675730-bc7d1900-b1a4-11eb-9fef-9d836041e294.png)

### Solution:
You need to update the storage bucket's CORS policy in order to access the media files. The CORS policy is in `cors.json`; to deploy it, you run `gsutil cors set cors.json <bucket-path>`

More: https://selom.medium.com/how-to-fix-a-no-access-control-allow-origin-error-message-on-google-cloud-storage-90dd9b7e3ddb