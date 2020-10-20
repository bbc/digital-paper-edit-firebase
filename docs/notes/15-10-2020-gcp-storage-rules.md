# GCP Storage rules

```js
rules_version = '2';
// Grants a user access to a node matching their user ID
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      function isValidEmail(){
       return ((request.auth.token.email.matches('.*@wsj[.]com$') || request.auth.token.email.matches('.*@dowjones[.]com$')) &&
        request.auth.token.email_verified)
      }
      allow read, write: if isValidEmail();
    }
  }
}
```

- [Understand Firebase Security Rules for Cloud Storage](https://firebase.google.com/docs/storage/security)
