# [short title of solved problem and solution]

- Status: accepted
- Deciders: Eimi
- Date: 2019-12-02

Technical Story: Related to #4. Needing to rethink the design of the database schema so that we can balance ease of security implementation and easy of use.

## Context and Problem Statement

[Security rules](https://firebase.google.com/docs/firestore/security/get-started) in Firebase is glob-like.

```c++
service cloud.firestore {
  match /databases/{database}/documents {
    match /<some_path>/ {
      allow read, write: if <some_condition>;
    }
  }
}
```

We need to add user authentication ID to the conditional statement above to tighten security for who can access our data. This means that we might need to rethink how we want to organise the data, as it was initially thought to be flat:

```text
/users/{uId}
/projects/{pId}
/transcripts/{trId}
/paperedits/{peId}
/uploads/{upId}
```

If we retained flatness, it will be easy to access the data - however we need to complicate our data structure by retaining the user ID in each of the records.

## Decision Drivers <!-- optional -->

- Security
- Ease in implementation (DB)
- Ease in implementation (Security Rules)
- Extensibility

## Considered Options

- Flat collections with `users` in every collections' field
- Users with rest as subcollections
- 2 collections: Users and Projects with `users` field and rest as subcollections

## Decision Outcome

Chosen option: "2 collections", because when thinking about membership and extensibility, we'd want to be able to have multiple `users` in a single `project` and every asset (`transcripts`, `paperEdits`) should be associated with a `project`.

We will authenticate users based on a field in projects called `users`. Each project will have several users like so:

- `projects/{id}/users` = []

A security rule like below will be able to test authentication and membership of the project on users.

````js
function isOnProject() {
    return request.auth.uid in get(/databases/$(database)/documents/projects/$(pid)).data.users;
}
```

### Uploads (Storage and Firestore)

The `uploads` subcollection has been added to the `users` for security and convenience: Storage rules are a lot easier to implement based on users, and we want to make things symmetric as possible.

| Firestore                   | Storage                     |
| --------------------------- | --------------------------- |
| `users/{id}/uploads/{upId}` | `users/{id}/uploads/{upId}` |

To keep consistency, we also use the same `id` for `transcript` and `uploads`

| Firestore                              | Firestore                     |
| -------------------------------------- | ----------------------------- |
| `projects/{id}/{transcripts}/{itemId}` | `users/{id}/uploads/{itemId}` |
````
