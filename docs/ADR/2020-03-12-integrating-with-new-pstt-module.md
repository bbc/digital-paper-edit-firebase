# Designing the integration with the new NewsLab's PSTT service

- Status: [accepted | superseded by [ADR-0005](0005-example.md) | deprecated | …] <!-- optional -->
- Deciders: Eimi, Ashley, Ben
- Date: 2020-03-26

Technical Story: As of March 2020, there is a contractor working on a reusable component that fronts Platform STT.

## Context and Problem Statement

We want to connect to Newslabs' shared STT service (named Newslabs PSTT).

## Decision Outcome

Ashley is building a service that will have an API Gateway and an S3 bucket. Uploading to the S3 bucket will trigger the STT event. We will be uploading to a bucket, as the previous architecture, with limitations that will define how we will communicate with Newslabs' PSTT service.

There will only be one shared bucket per environment for services using this service. The name of the bucket is "newslabs-stt-media-to-transcribe" and "newslabs-stt-media-to-transcribe-test".

### Limitations

- Newslabs pstt will only handle audio files (`mp3`, `mp4`, `wav`, `flac`)
- the client (dpe) need to ensure they upload audio not video
- do not use the eTag as the reference, use object key instead: `<service_name>/<object_key>.<ext>`
- assume that the client is sending a unique object key

### Example

#### Upload

When uploading a file with Object Key: `280612.mp3`, the Object Key should be prepended with the service name: `dpe/280612.mp3`

#### Status

The endpoint for requesting the status of a transcription uses [this lambda](https://github.com/bbc/newslabs-stt/tree/master/newslabs-stt-check-transcription), which returns the transcription status.
There is an example response in the README.

Make a request to an API Gateway endpoint (please ask) with something like this in the request body:

```json
{
  "objectKey": "dpe/uuid.ext"
}
```
