# Saving word level transcripts in Firebase

* Status: in progress <!-- optional -->
* Deciders: Eimi, Pietro <!-- optional -->
* Date: 2019-11-27  <!-- optional -->

Technical Story: [description | ticket/issue URL] <!-- optional -->

## Context and Problem Statement

### The Conext
The context is the development of applications to work with transcriptions of audio or video interviews, these could range from 20 minutes to 1 hour or over in length, depending on the production requirements.


### The Problem 
Saving word level timed text transcriptions into firebase.

Data structure (refered to as DPE Json)

```json
{
  "words": [
    {
      "id": 0,
      "start": 1.4,
      "end": 3.9,
      "text": "Hello"
    },
    ...
  ],
  "paragraphs": [
    {
      "id": 0,
      "start": 1.4,
      "end": 4.2,
      "speaker": "TBC 0"
    },
  ...
  ]
}
```

Paragraphs and speakers are interpolated on the client.

In this domain we generally use components such as [@bbc/react-transcript-editor](https://github.com/bbc/react-transcript-editor) as a way to manipulate timed text.

Generally this data structure is quite efficient, compared to GCP STT one hour worth of transcript, in GCP STT is easily 2mb while in this DPE format it is 1.3mb.

We have seen that 20 min worth of timed text, can be saved in firestore, as in this DPE json format it's roughly 315 KB. - roughly 3581 words.

_For an example see [Soleio interiview as example in DPE demo](https://bbc.github.io/digital-paper-edit-client/#/projects/10046281c4ad4938b7d0ae6fa9899bec/transcripts/1000cjw29xii80000ird74yb19swa/correct), (click export btn arrow top right, and choose last option `Digital Paper Edit - Json`)_
The problem is balancing technical limitations and cost: while we want to take advantage of Firestore, there is a limit (1MB) for uploads per document. The challenge is balancing the number of IO operations ([monetary cost](https://firebase.google.com/pricing)) and engineering effort. 

The following is the limit to free-tier:

Firestore
* GiB stored - 1 GiB / about 20 M chat messages at 50 bytes per chat message
* Document writes - 600,000 writes / number of times data is written
* Document reads - 1,500,000 reads / number of times data is read
* Document deletes - 600,000 deletes / number of times data is deleted
Firebase Storage
* GB stored - 5 GB / about 2,500 high-res photos at 2 MB per photo
* GB transferred - 30 GB / about 15,000 high-res photos at 2 MB per photo
* Operations (uploads & downloads) - 2,100,000 ops /about 210,000 uploads & 1,890,000 downloads
## Decision Drivers <!-- optional -->

1. Easy to reason around
2. Keeping cost down
3. Firestore document size limit of 1mb 
4. In Firestore reads of documents are charged individually 
5. Ideally a solution that can scale for storing over 1 hour worth of transcription without breaking a sweat
6. if needed paragraphs and words attribute could be saved in separate collections/documents.


## Considered Options

1. Break down data in firestore - "paginated" every 20 min
2. Break down data in firestore - "paginated" every paragraph
3. Break down data in firestore - every word is a document
4. Saving json in Firebase cloud storage?
5. Compression - JSONB 
6. Compression - JSONC
7. Compression - binary with UBJSON

## Decision Outcome

_TBC_
<!-- Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)]. -->

<!-- ### Positive Consequences 

* [e.g., improvement of quality attribute satisfaction, follow-up decisions required, …]
* …

### Negative consequences

* [e.g., compromising quality attribute, follow-up decisions required, …]
* … -->

## Pros and Cons of the Options <!-- optional -->

### 1. Break down data in firestore - "paginated" every 20 min


Data could be "paginated" in firestore, so that there could be a collection of words, and every x number of words (eg roughly every 3581 words objects), corresponding to 20 min worth of word objects could be split into a new document, eg words fragment.

This means that one hour for instance would only need to be split into a collection of 3 documents.

Two hours would be split into a collection of 6 documents, and so on.

When saving it could be splitted into these documents, and when retrieving could be combined back into one data structure. 

This is to show that the cost of the extra reads per transcription, would not be outrageous.

A [fireabse HTTPS callable functions](https://firebase.google.com/docs/functions/callable) could be used to save and retrieve from firestore to do this fragmenting and aggregating.

Using a cloud function as way to perform CRUD operations, would also incur the extra cost for the use of the cloud function. 

Also need to double check if this would introduce a considerable delay in the user experience, as the function might need to boot up before performing the operation (?).

* Good, because cost of reads would be contained
* Bad, because introduces cost of calling a firebase cloud function to perform the operation
* … <!-- numbers of pros and cons can vary -->



### 2. Break down data in firestore - "paginated" every paragraph

An alternative could also be to group the words by paragraphs.

However when correcting paragraphs on the client, these might change and get re-arranged, so there might not be a lot of value in this. Eg when saving back to firestore might be easier to override everything then diff changes.

* Good, because easy to reason around
* Bad, because could get expensive, as it would increase number of reads
* Bad, because paragraph breakdown subject to change
* … <!-- numbers of pros and cons can vary -->

### 3. Break down data in firestore - every word is a document

An alternative could also be to  save each word as it's on document in a collection of words. Same thing could be done for paragraphs.

However it could get very expensive to do a read of a whole document, as we'd need to fetch all the words etc.. and we'd get charge for every read. So even for a 20 minute transcript, with 3581 words, this could incur a substantial cost.

* Good, because easy to reason around
* Bad, because could get expensive, as it would increase number of reads


### 4. Saving json in Firebase cloud storage?

Another option is to use firestore triggers and/or [HTTPS callable functions](https://firebase.google.com/docs/functions/callable) to save the DPE json format into cloud storage.

There would be no size limit, but we would not be able to take advantages of firebase functionalities for the data. 

In the current client, when saving a timed transcript the whole payload is returned, there is currently no option to save intermediate results, or only what's the latest change. 

This might change and get optimised in the future, but we also just want a solution that works for the now, and then look at ahead at further refactor and optimization.

* Good, because file size limit on cloud storage is more then enough at [5TB](https://cloud.google.com/storage/quotas)
* Bad, because introduces cost of calling a firebase cloud function to perform the operation
* Bad, because it might introduce a delay (?)

### 5. Compression - JSONB 
Another option is to compress the json. eg with [js-bson](https://github.com/mongodb/js-bson)

If we consider that 1 hour in DPE format is 1.3 MB, and for reference in GCP STT json format it is 2mb. After BSON compressed is 836 KB.

As we so in the data structure example above for DPE json, paragraphs and words could be separated.

So if you do words only then it's 1.1MB compressed to 822KB.
And paragraphs that are 15KB in DPE json, and after JSONB compression they go down to 11KB.

So I'd say this doesn't help much (?).

Hard to see how this compression option would scale.

* Good, because for around an hour worth of transcript, could get it below 1mb
* Bad, because Hard to see how this compression option would scale.

### 6. Compression - JSONC

[github JSONC](https://github.com/tcorral/JSONC), [npm jsonc](https://www.npmjs.com/package/jsonc)

> Be careful with this method because it's really impressive if you use it with a JSON with a big amount of data, but it could be awful if you use it to compress JSON objects with small amount of data because it could increase the final size.

article from [coderwall, compress your json data](https://coderwall.com/p/mekopw/jsonc-compress-your-json-data-up-to-80)

```js
const fs = require('fs')
const jsonc = require('jsonc');
const gcpSttResponseJson = require('./create-1574786669322.json')

const gcpToDpe = require('gcp-to-dpe');
const gcpTranscript = gcpSttResponseJson.response;
const dpeTranscript = gcpToDpe(gcpTranscript);
fs.writeFileSync('dpe.json',JSON.stringify(dpeTranscript,null,2))


const compressedJSON = jsonc.parse( dpeTranscript );
fs.writeFileSync('jsonc-compressed.json',compressedJSON);
```
got an error
```
return result + (insideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));

TypeError: jsonString.slice is not a function
```

<!-- * Good, because [argument a]
* Good, because [argument b] -->
* Bad, because wasn't able to try out the libary

### 7. Compression - binary with UBJSON
[ubjson](https://www.npmjs.com/package/@shelacek/ubjson)

Firestore can support binary data, so json could be compressed to binary.

When trying this out 
```js
const fs = require('fs')
const ubjson = require('@shelacek/ubjson');
const gcpToDpe = require('gcp-to-dpe');

const gcpSttResponseJson = require('./create-1574786669322.json')
const gcpTranscript = gcpSttResponseJson.response;
const dpeTranscript = gcpToDpe(gcpTranscript);

const buffer = ubjson.encode({ dpeTranscript, from: ['UBJSON'] });

fs.writeFileSync('Ubjson',buffer);
```

Got an error
```
RangeError: Maximum call stack size exceeded
```
<!-- * Good, because [argument a]
* Good, because [argument b] -->
* Bad, because wasn't able to try out the libary
