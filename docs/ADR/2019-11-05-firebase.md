# Firebase infrastructure

- Status: accepted
- Deciders: Eimi, James, Alli, Susie
- Date: 2019-11-05

This is related to a previous ADR: see [modular architecture ADR](./2019-05-09-modular-architecture.md)

Technical Story: Evaluating Firebase for our backend, replacing most of the AWS infrastructure, except for PSTT client (queue and instance to talk to PSTT).

## Context and Problem Statement

We have quite a few components to build up in the backend to get DPE to a stable point. Although initially decided to do development in AWS, working on AWS had been quite challenging with a steep learning curve. In a single project cycle, we've reached a point where we had infrastructures of most microservices setup. Unfortunately resources were removed from the project and priorities shifted to UX research, while back-end development halted. Picking these development tasks from half baked microservices is difficult. We now have to relearn what we've developed and complete integration. In order to simplify back-end development, we are looking at Firebase (Google Cloud Platform). Since Firebase is a plaftorm that targets development for startups and R&D, it provides many features out of the box. This could speed up developing the backend, namely the realtime database, authentication, while keeping possibilities open for offline, mobile, and multi-user solutions. We must consider technical (security, development, transfer, upfront learning) and non-technical (legal) cost.

Since we've designed the React components to be reusable, there is a question of whether AWS vs GCP makes it easier for transfer. Previous projects had all been rebuilt from scratch, including the infrastructure. Realistically, does it matter which Cloud provider we go with?

![Firebase architectural diagram](https://github.com/bbc/digital-paper-edit-client/blob/firebase/docs/img/firebase-arch.png)

### Description of Microservices

| Name                     | Technology                           | Description                                                                                                                                              |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase                 | GCP Firebase hosting, main component | The hosted solution                                                                                                                                      |
| Firestore                | GCP Firestore, database              | The database with additional capabilities (realtime)                                                                                                     |
| Audio Converter Function | GCP Function, serverless             | The serverless service that strips audio from the original AV content                                                                                    |
| AWS Uplaoder Function    | GCP Function, serverless, KMS        | The serverless service that uploads a file to S3                                                                                                         |
| STT Client               | AWS EC2, PSTT                        | SQS Consumer that consumes messages to send to Platform STT (third party) and forwards the status updating messages from the SNS topics from PSTT        |
| STT Client Queue         | AWS SQS                              | A SQS service that takes new Job messages to send to PSTT Client                                                                                         |
| Notification Function    | Functions, serverless                | A serverless service that takes Notification messages off the Pub/Subs serice to update Firestore                                                        |
| STT Topic                | AWS STS                              | A topic for anything to subscribe to for notifications. This is to help with collecting all the notification. The messages are created by the STT Client |

- Audio Converter Function is listening for Storage changes
- AWS Proxy Function is listening for Storage changes
- STT Client is listening for messages (job creation) from a queue

### Steps

1. User uploads AV file to Storage from Firebase
2. Audio Converter Function:
   1. detects file upload
   2. strips audio from file
   3. upload file to Storage
3. AWS Proxy Function:
   1. detects file upload
   2. retrieves Key from GCP KMS
   3. assumes role as AWS IAM
   4. uploads file to S3
4. [S3 Event triggers to be sent to Queue](https://docs.aws.amazon.com/AmazonS3/latest/user-guide/enable-event-notifications.html)
5. STT Client:
   1. creates new Plaform STT job:
      4. upload file to Platform STT's S3 bucket
      5. send message with file loaded to Platform STT
   2. Forwards notifications from Platform STT's SNS to STT Notifications SNS
6. [AWS notification Subscription Function](https://cloud.google.com/community/tutorials/cloud-functions-sns-pubsub)
   1. updates Firestore
7. Firestore listener updates Firebase

![AWS architectural diagram](https://raw.githubusercontent.com/bbc/digital-paper-edit-infrastructure/master/docs/adr/newest_arch.png)
![Firebase - what's done?](https://github.com/bbc/digital-paper-edit-client/blob/firebase/docs/img/dpe-aws-not-available.png)

## Decision Drivers

- Security (Authentication, PSTT integration)
- Legal
- Transfer
- Technical feasibility of DPE only
- Technical feasibility of CI, reproduceability
- Cost (time, money, engineering, opportunity)

## Considered Options

1. AWS only
2. Firebase and AWS

## Decision Outcome

Firebase and AWS combined as PSTT integration is feasible to do, even with cross acount complications. Features such as authentication, user specific data retrieval, integration with database without migrations is already completed. Firebase provides abstractions around security and integrations with the database, as well as Functions. To save time around the project with features such as realtime database and easy API use, let's progress with Firebase. There are still some things such as CI, Deployment management that can be worked on, but this is a stretch goal for now. All in all, I believe that it will save time, and simply the overall architecture and code.

### Positive Consequences

- Faster turnaround for development
- Authentication
- Realtime database beneficial for some of our DPE requirements
- Managed services with many abstractions

#### Secondary positive consequences

- Growing knowledge of GCP
- BBC Login (stretch goal)
- monitoring given out of the box (console.log maps to logging to GCP Logging Console)

### Negative consequences

- Upfront cost of learning for developers and there are many unknowns, until looked into
- Security concerns
- Redesigning architecture
- Redesigning database model
- Transfer not possible with infrastructure (?)

## Pros and Cons of the Options

Before we discuss the pros and cons of each of the options, we needed to have a clear idea about each component, how far it is from so-called-completion in AWS and GCP and pros and cons of each technology. Here I describe:

What it needs to do
What it currently does

Anywhere noted with \* is an indicator of a stretch goal.

### Client

#### What it needs to do

- From the UI, users can view and alter (their own\*) data
- Initiate transcription process

#### AWS and GCP

- [x] The integration with the API works on both AWS and GCP.
- [x] both are deployed as web endpoints.
- [x] both endpoints are secured by some form of authentication.

#### AWS

- [x] There is a cert-based authentication set up.
- [ ] Individual user data.\*
- [ ] file upload
- [ ] S3 setup and access

#### GCP

- [x] there is already an authentication set up for GCP that is whitelisting based.
- [x] User specific data retrieval\*
- [ ] file upload (there are easy ways of showing progress of uploading of files)
- [ ] Storage access (see security rules setup, is open by default)
- [ ] The potential here is BBC Login integration, which is more user friendly.\*

```js
var storageRef = firebase.storage.ref("folderName/file.jpg");
var fileUpload = document.getElementById("fileUpload");
fileUpload.on(‘change’, function(evt) {
  var firstFile = evt.target.file[0]; // get the first file uploaded
  var uploadTask = storageRef.put(firstFile);
  uploadTask.on(‘state_changed’, function progress(snapshot) {
     console.log(snapshot.totalBytesTransferred); // progress of upload
  });
});
```

### API and Database

What it needs to do

- The API connects to the database to do CRUD operations
- The API invokes the audio conversion
- The API invokes the transcription service
- The API is notified by PSTT Client to update status of transcription
- Secure connection to database, audio conversion, transcription service

AWS and GCP

- [ ] API is incomplete
- [x] Can connect to the DB (AWS has been buggy as of late)

AWS

- [x] deployed API
- [x] deployed Postgres DB
- [ ] full integration with database
- [ ] migrations setup
- [ ] local environment setup\*
  - [ ] VM
- [x] environment set up is complete

GCP

- [ ] local environment setup\*
  - [ ] Setup with Firebase's [emulator tool](https://firebase.google.com/docs/functions/local-emulator)
- [x] deployed Firestore (realtime DB, NoSQL)
- [ ] full integration with database
- no migrations necessary as it is a NoSQL database
- it is also possible to store references to a specific data, which simplifies certain aspects of file retrieval
- The setup in client is also simplified as there needs to be no abstraction of the database connection
- removes the need for `setTimeout()` setup in Client for data retrieval as Firestore offers realtime data retrieval

### Audio converter

What it needs to do

- Convert input to audio
- Store output in an accessible online location
- Handle long form content\*

AWS and GCP

- [x] Deployed
- [ ] Uploads audio content to storage
- [ ] Integration with PSTT Client

AWS

- [ ] Integration with API
  - [ ] Queue message being sent from API to Audio Converter queue
- [x] environment set up is complete

GCP

- [ ] Integration with Client
  - [x] I've done it but not currently operating due to cost (free tier)
- [ ] environment set up is complete (follow [instructions from their docs](https://firebase.google.com/docs/projects/multiprojects))

### PSTT Client

What it needs to do

- send content (URL) to PSTT
- send notifications of status change to API
- send output back to users by getting the content from the S3 bucket.

What it currently does

AWS and GCP

- [x] deployed
- [x] logic is functional
- [ ] does ^ (unknown until further tested)

GCP

- [ ] IAM for the AWS / GCP integration (this requires 2 account creations with credentials. One to access the PSTT client's queue, and another for the PSTT client to use to update the database with the status and the JSON transcription blob).
  - [ ] store Key in GCP's KMS

To do this, we:

1. create an IAM in AWS as part of PSTT Client
2. store the credentials of the IAM in GCP's KMS.
3. the GCP service assumes the IAM role and

This is something that Datalab has already done so we can use their knowledge.

### AWS Only

Continuing development of AWS only. This will mean picking up where we left off. We currently have a setup around every single microservice. It is difficult to say how far we are, as each setup in Jenkins and integration could provide some challenges.

- Good, because best practices are ensured and infosec approved.
- Good, because all the microservices are there (infrastructrually)
- Bad, because the best practices means jumping through many developmental steps which could be time consuming.
- Bad, we currently don't have any integration other than UI, DB and API.
- Bad, DB and API does connect but is faulty at the moment
- Bad, no easy way to setup local testing environment for DB.
- Bad, we need to do migrations, but we have not set that up.

### GCP and AWS

This means we will be doing Firebase and AWS combined. See ![]("./DPE - firebase ver.png").
Eimi has spoken to several people to clear out the unknowns around cross-acount integrations, deployment pipelines, etc.

- Good, because it simplifies the code (client).
- Good, because authentication and complexity is handled.
- Good, because we have a whitelisting system already in place.
- Good, because it gives you a local test environment.
- Bad, because complexity around cross acount integration
- Bad, because not so steep but still, a learning curve

#### Secondary

- Good, because realtime database\*

## Links <!-- optional -->

- Pros and cons: [Lessons from a small Firebase project.](https://itnext.io/lessons-from-a-long-week-with-firebase-b433ce8ee49e)
- More on the lifecycle of [GCP Functions](https://firebase.google.com/docs/functions)
- GCP Environment set up can be done by following [instructions from their docs](https://firebase.google.com/docs/projects/multiprojects))
