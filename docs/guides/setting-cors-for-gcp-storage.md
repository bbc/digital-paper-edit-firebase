# Setting CORS for GCP storage

```json
[
  {
    "origin": ["https://dj-con-innovation-dpe-web-poc.web.app", "http://localhost:3000"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["*"]
  }
]
```

```json
[{ "maxAgeSeconds": 3600, "method": ["GET"], "origin": ["*"] }]
```

[install gsutil](https://cloud.google.com/storage/docs/gsutil_install)

```
gsutil cors set cors.json gs://dj-con-innovation-dpe-web-poc.appspot.com
```

## links

- [Firebase Storage and Access-Control-Allow-Origin](https://stackoverflow.com/questions/37760695/firebase-storage-and-access-control-allow-origin)
- [Cross-origin resource sharing (CORS)](https://cloud.google.com/storage/docs/cross-origin#Configuring-CORS-on-a-Bucket)
- [Configuring cross-origin resource sharing (CORS)](https://cloud.google.com/storage/docs/configuring-cors#json-api)

---

alternativly can get the download url for a media ref

```js
const dlUrl = await firebase.storage.storage.ref(mediaRef).getDownloadURL();
```
