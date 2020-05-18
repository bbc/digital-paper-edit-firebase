# Saving word level transcripts in Firebase

- Status: in progress <!-- optional -->
- Deciders: Eimi, Pietro <!-- optional -->
- Date: 2019-11-27 <!-- optional -->

Technical Story: [description | ticket/issue URL] <!-- optional -->

## Context and Problem Statement

### The Context

The context is the development of applications to work with transcriptions of audio or video interviews, these could range from 20 minutes to 1 hour or over in length, depending on the production requirements.

We need to save word level timed text transcriptions into Firebase and Firestore.
In this domain we generally use components such as [@bbc/react-transcript-editor](https://github.com/bbc/react-transcript-editor) as a way to manipulate timed text.

We have seen that 20 min worth of timed text transcription in JSON (see below, referred to as DPE JSON) format is roughly 315 KB - roughly 3581 words.

20 minutes is conservative - could also be pushed up to 30 minutes. I think if the limit is 1000KB, we should at least aim to be around the 50% mark (500KB).

Generally the data structure for the transcription is quite efficient. Comparing 1 hour worth of transcription in GCP STT and DPE JSON, GCP STT is easily 2MB while the equivalent DPE data format is 1.3MB.

_For an example see [Soleio interiview as example in DPE demo](https://bbc.github.io/digital-paper-edit-client/#/projects/10046281c4ad4938b7d0ae6fa9899bec/transcripts/1000cjw29xii80000ird74yb19swa/correct), (click export btn arrow top right, and choose last option `Digital Paper Edit - Json`)_

#### Transcription

Paragraphs and speakers are interpolated on the client.
Data structure (referred to as DPE JSON)

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

### The Problem

The problem is balancing technical limitations and cost: while we want to take advantage of Firestore, there is a limit (1MB) for uploads per document. The challenge is balancing the number of IO operations ([monetary cost](https://firebase.google.com/pricing)) and engineering effort.

For instance these are the following is the limit to free-tier:

#### Firestore

- GiB stored - 1 GiB / about 20 M chat messages at 50 bytes per chat message
- Document writes - 600,000 writes / number of times data is written
- Document reads - 1,500,000 reads / number of times data is read
- Document deletes - 600,000 deletes / number of times data is deleted

#### Firebase Storage

- GB stored - 5 GB / about 2,500 high-res photos at 2 MB per photo
- GB transferred - 30 GB / about 15,000 high-res photos at 2 MB per photo
- Operations (uploads & downloads) - 2,100,000 ops /about 210,000 uploads & 1,890,000 downloads

#### Cloud Functions

- Invocations - 2,000,000 invocations / number of times a function is invoked
- GB-seconds - 400,000 GB-seconds / time with 1 GB of memory provisioned
- CPU-seconds - 200,000 CPU-seconds / time with 1 GHz CPU provisioned
- Networking (egress) - 5 GB / outbound data transfer

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
4. Saving JSON as a file in Firebase cloud storage, while storing the location of path in Firestore
5. Compression - BSON - Binary JSON
6. Compression - JSONC with Gzip
7. Compression - UBJSON - Universal Binary JSON
8. Convert to a collection of 3 `tsv` documents
9. Compression - Gzip only using `zlib`

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

A [firebase HTTPS callable functions](https://firebase.google.com/docs/functions/callable) could be used to save and retrieve from firestore to do this fragmenting and aggregating.

Using a cloud function as way to perform CRUD operations, would also incur the extra cost for the use of the cloud function.

Also need to double check if this would introduce a considerable delay in the user experience, as the function might need to boot up before performing the operation (?).

- Good, because cost of reads would only increase by smaller increments based on length of content
- Good, because it's easy to do cost estimation
- Bad, because introduces cost of calling a firebase cloud function to perform the operation
- … <!-- numbers of pros and cons can vary -->

### 2. Break down data in firestore - "paginated" every paragraph

An alternative could also be to group the words by paragraphs.

However when correcting paragraphs on the client, these might change and get re-arranged, so there might not be a lot of value in this. Eg when saving back to firestore might be easier to override everything then diff changes.

- Good, because easy to reason around
- Bad, because could get expensive, as it would increase number of reads
- Bad, because could get expensive, as it would increase number of writes
- Bad, because paragraph breakdown subject to change
- … <!-- numbers of pros and cons can vary -->

### 3. Break down data in firestore - every word is a document

An alternative could also be to save each word as it's on document in a collection of words. Same thing could be done for paragraphs.

However it could get very expensive to do a read of a whole document, as we'd need to fetch all the words etc.. and we'd get charge for every read. So even for a 20 minute transcript, with 3581 words, this could incur a substantial cost.

- Good, because easy to reason around
- Bad, because could get expensive, as it would increase number of reads

### 4. Saving JSON in Firebase cloud storage?

Another option is to use firestore triggers and/or [HTTPS callable functions](https://firebase.google.com/docs/functions/callable) to save the DPE json format into cloud storage.

There would be no size limit, but we would not be able to take advantages of firebase functionalities for the data.

In the current client, when saving a timed transcript the whole payload is returned, there is currently no option to save intermediate results, or only what's the latest change.

This might change and get optimised in the future, but we also just want a solution that works for the now, and then look at ahead at further refactor and optimization.

- Good, because file size limit on cloud storage is more then enough at [5TB](https://cloud.google.com/storage/quotas)
- Bad, because introduces cost of calling a firebase cloud function to perform the operation
- Bad, because it might introduce a delay (?)

### 5. Compression - BSON 

Another option is to compress the json. eg with [js-bson](https://github.com/mongodb/js-bson)

If we consider that 1 hour in DPE format is 1.3 MB, and for reference in GCP STT json format it is 2mb. After BSON compressed is 836 KB.

As we so in the data structure example above for DPE json, paragraphs and words could be separated.

So if you do words only then it's 1.1MB compressed to 822KB.
And paragraphs that are 15KB in DPE json, and after JSONB compression they go down to 11KB.

On average, this saves up to 60% in size - but there has been an occasion when it's increased in size, so we would need to do more testing. The is [some documentation](https://stackoverflow.com/questions/24114932/which-one-is-lighter-json-or-bson) in the official FAQ of BSON as to why that may happen more frequently than not.
For more comparison information, see [here](https://www.educba.com/json-vs-bson/)

Hard to know if this compression option would be reliable and consistent.

- Good, because for around an hour worth of transcript, could get it below 1mb
- Bad, because we need to do a lot more testing

### 6. Compression - JSONC

[github JSONC](https://github.com/tcorral/JSONC), [npm jsonc](https://www.npmjs.com/package/jsoncomp)

> Be careful with this method because it's really impressive if you use it with a JSON with a big amount of data, but it could be awful if you use it to compress JSON objects with small amount of data because it could increase the final size.

article from [coderwall, compress your json data](https://coderwall.com/p/mekopw/jsonc-compress-your-json-data-up-to-80)

```js
const fs = require("fs");
const jsonc = require("jsonc");
const gcpSttResponseJson = require("./create-1574786669322.json");

const gcpToDpe = require("gcp-to-dpe");
const gcpTranscript = gcpSttResponseJson.response;
const dpeTranscript = gcpToDpe(gcpTranscript);
fs.writeFileSync("dpe.json", JSON.stringify(dpeTranscript, null, 2));

const compressedJSON = jsonc.parse(dpeTranscript);
fs.writeFileSync("jsonc-compressed.json", compressedJSON);
```

got an error

```
return result + (insideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));

TypeError: jsonString.slice is not a function
```

<!-- * Good, because [argument a]
* Good, because [argument b] -->

- Bad, because wasn't able to try out the libary

### 7. Compression - binary with UBJSON

[ubjson](https://www.npmjs.com/package/@shelacek/ubjson)

Firestore can support binary data, so json could be compressed to binary.

When trying this out

```js
const fs = require("fs");
const ubjson = require("@shelacek/ubjson");
const gcpToDpe = require("gcp-to-dpe");

const gcpSttResponseJson = require("./create-1574786669322.json");
const gcpTranscript = gcpSttResponseJson.response;
const dpeTranscript = gcpToDpe(gcpTranscript);

const buffer = ubjson.encode({ dpeTranscript, from: ["UBJSON"] });

fs.writeFileSync("Ubjson", buffer);
```

Got an error

```
RangeError: Maximum call stack size exceeded
```

<!-- * Good, because [argument a]
* Good, because [argument b] -->

- Bad, because wasn't able to try out the libary

### 8. Convert to a collection of 3 `tsv` documents

It is stated in firebase docs, that within 1mb, you could hold a whole book (soruce needed). As generally a whole book in plain text it's under 1mb.
[Moby dick from project gutenberg](<(https://www.gutenberg.org/files/2701/2701-h/2701-h.htm)>) it's 1.3mb. roughly 215,831 words.

If 3581 words in 20 minutes then in 215,831 words it's 1,205.42 minutes, which is roughly 20 hours.

_if my math is not failing me_

So words like this

```json
{
  "words": [
    {
      "id": 0,
      "start": 1.4,
      "end": 3.9,
      "text": "Can"
    },
    {
      "id": 1,
      "start": 3.9,
      "end": 4,
      "text": "you"
    },
    {
      "id": 2,
      "start": 4,
      "end": 4.1,
      "text": "hear"
    },
    {
      "id": 3,
      "start": 4.1,
      "end": 4.2,
      "text": "it?"
    },
    ...
```

could be converted to one string, so a document in a collection

```
Text startTime endTime\ttext startTime endTime\t...
```

```
Can 1.4 3.9\tyou 3.9 4\thear 4 4.1\tit? 4.1 4.2\t...
```

or alternatevely as a proper `tsv` as

```
Text\tstartTime\tendTime
Text\tstartTime\tendTime
...
```

```
Can\1.4\t3.9\nyou\t3.9\t4\n...
```

You generally use the \n to break to say that it's a new record, but you use tabs to differentiate the values, instead of spaces. See [JS TSV lib](https://github.com/ricardobeat/TSV)

And then parse it back to a list of words objects.

or it could be a collection with 3 documents. of type text string

first one is text

```
Can\tyou\thear\tit?\t...
```

then a document for the Start timecodes

```
1.4\t3.9\t4\t...
```

last but not least a document for the End timecodes

```
3.9\t4\t4.2\t
```

eg quick example of code, for separate text, start, and end time.

```js
const dpeJson = require("./dpe.json");

const text = dpeJson.words
  .map(word => {
    return word.text;
  })
  .join("\t");

console.log(text);

const startTime = dpeJson.words
  .map(word => {
    return word.start;
  })
  .join("\t");

console.log(startTime);

const endTime = dpeJson.words
  .map(word => {
    return word.end;
  })
  .join("\t");

console.log(endTime);
```

From 1.4M to 85K for end time, 85K for start time and 70K for text.

Or combined

```js
const dpeJson = require("./dpe.json");

console.log(dpeJson);

const text = dpeJson.words
  .map(word => {
    return `${word.text}\t${word.start}\t${word.end}`;
  })
  .join("\t");

console.log(text);
```

example output (where the spaces are tabs `\t`)

```js
the     4511.7  4511.9  scrape  4511.9  4512.2  on      4512.2  4512.4  Ematic  4512.4  4512.6  Lee.    4512.6  4512.8  I       4514.6  4515.3  think   4515.3  4515.8  most    4515.8  4516.6  of      4516.6  4516.6  like    4516.6  4517.6  journalism      4517.6  4518    organizations.  4518    4518.4
```

From 1.4M `json` to 241K `tsv`.

as a quick example of reassambly from tsv to json

```js
// const fs = require('fs');
//const textTsv  = fs.readFileSync('dpe-text.tsv').toString()
// const startTimeTsv  = fs.readFileSync('dpe-startTime.tsv').toString()
// const endTimeTimeTsv  = fs.readFileSync('dpe-startTime.tsv').toString()

const startTimeList = startTimeTsv.split("\t");
const endTimeList = endTimeTimeTsv.split("\t");

const words = textTsv.split("\t").map((wordText, index) => {
  return {
    text: wordText,
    start: startTimeList[index],
    end: endTimeList[index]
  };
});

const result = { words };

console.log(result);
```

Paragraphs would get saved in a similar way with speaker attribute instead of text attribute in a separate collection.

The conversion could be done either on the client or in a cloud function.

- Good, because can save a lot of space
- Bad, because serializing and deserialising could introuce errors in the data
- … <!-- numbers of pros and cons can vary -->

### 9. Compression with Gzip

Using Gzip (zlib) module to zip and unzip an entire JSON.

See implementation [here](https://github.com/emettely/compare-json-compression/blob/master/src/gzip.js)

If Gzip gives a compression rate of 85% for the entire JSON without extraction of words, it's simpler and might be good enough, assuming the longest video might be 6 hours long. E.g if the transcript size is 5MB in size and the compression is 85%, it'll result in 0.75MB, under the 1MB limit. So tl;dr just using Gzip only gives a good balance of simplicity and compression.

- Good, because saves lots (85%) of [space](https://github.com/emettely/compare-json-compression#outcome)
- Good, because you don't need an extra library (if you have NodeJS)
- Good, because it's pretty fast
- Bad, because you are serializing and deserializing data and would need an additional step to debug if there's an error
