# Designing the integration with the new NewsLab's PSTT service

- Status: [accepted | superseded by [ADR-0005](0005-example.md) | deprecated | …] <!-- optional -->
- Deciders: Eimi, Ashley, Ben
- Date: 2020-03-26

Technical Story: As of March 2020, there is a contractor working on a reusable component that fronts Platform STT.

## Context and Problem Statement

We want to connect to Newslabs' shared STT service (named Newslabs PSTT).

## Decision Outcome

Ashley is building a service that will have an API Gateway and an S3 bucket. Uploading to the S3 bucket will trigger the STT event. We will be uploading to a bucket, as the previous architecture, with limitations that will define how we will communicate with Newslabs' PSTT service.

There will only be one shared bucket for all services using this service.

### Limitations

- Newslabs pstt will only handle audio files (mp3 | mp4 | wav | flac)
- the client (dpe) need to ensure they upload audio not video
- do not use the eTag as the reference, use object key instead: `<service_name>/<object_key>.<ext>`
- assume that the client is sending a unique object key

#### Example

For DPE with Object Key 280612.mp3 would be `dpe/280612.mp3`

The S3 input bucket (for requesting audio to be transcribed) is ready to test on DPE side, so whoever is going to start that work give me a shout and we can run through together
The endpoint for requesting the status of a transcription is also ready (test environment only, for now).

I’ve put a dummy transcription in there so we can test those two points of contact with DPE…uploading an audio file and requesting the status
This is the lambda which returns the transcription status:
https://github.com/bbc/newslabs-stt/tree/master/newslabs-stt-check-transcription
And you can see an example response in the README there. It’s linked to an API Gateway endpoint which is what you’ll need to send requests to for the updates.

### Limitations

## Links <!-- optional -->

- [Link type][link to adr] <!-- example: Refined by [ADR-0005](0005-example.md) -->
- … <!-- numbers of links can vary -->
