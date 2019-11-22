# Digital Paper Edit - Firebase

---> _Work in progress_ <--

An application to make it faster, easier and more accessible to edit audio and video interviews using automatically generated transcriptions form STT service.

See [intro](./docs/intro.md) for more info on the project. And [user journey](./docs/user-journey/user-journey.md) for a high level overview of the user journey.

## Project Architecture

This is a simplified version of the [`bbc/digital-paper-edit-client`](https://github.com/bbc/digital-paper-edit-client) application, using Firebase.
There are many moving parts in this project, but Firebase is self-contained. If you want to see all the projects you can also look at them as a list [here](https://github.com/topics/digital-paper-edit). Most React Components are developed, maintained and imported from [`bbc/digital-paper-edit-react-components`](https://github.com/bbc/digital-paper-edit-react-components). There is a Storybook (demo) website in the repo that you access to view the components.

See docs in ADR for an understanding of the architectural decisions made. If you'd like some information on Firebase, pleaseread [Firebase ADR](./docs/ADR/2019-11-05-firebase.md) and the [Modular Architecture ADR for more info on the implementation](./docs/ADR/2019-05-09-modular-architecture.md)

![Firebase architecture diagram](./docs/img/firebase-arch.png)

## Versioning

The projects use [npm semantic versioning](https://docs.npmjs.com/about-semantic-versioning)

## Current project board

- [BBC News Labs - Digital Paper Edit - Sprint Board](https://github.com/orgs/bbc/projects/47)

The project is divided into [concurrent milestones as described here](https://github.com/bbc/digital-paper-edit-client/milestones) with UX being an overarching milestone that cuts across these different parts.
See [UX Approach](./docs/guides/ux-approach.md) in docs guides for more information on the UX development process.

## Setup

Optional step to setup [nvm](https://github.com/nvm-sh/nvm) to use node version 10, otherwise just use node version 10

```sh
nvm use || nvm install`
```

in root of project

```sh
npm install
```

## Configuration

[`.env`](./.env) contains environment config for the React client side app. You can copy over the `.env.example` to start.
`REACT_APP_NAME` App name is used in browser title and navbar component.

## Development

<!-- `cd` into the individual repository inside [`./packages`](./packages) and npm start, or see respective README and package.json for how deal with each. -->

You must setup the Firebase credentials in order to do development of the project as mentioned in above Configuration section. Firebase can be free, but some parts of the app may not work.
In root of the project (`cd digital-paper-edit-firebase`):

```sh
npm run start
```

This will start two servers: proxy (`3000`) and Firebase server (`4000`). You should have an entry point app running in port `3000`.

## Production

See Configuration step above and configure `firebase.json`, `.firebaserc` to change the sitename and environment.

To deploy to development environment:

```sh
npm run deploy:dev:hosting
```

To deploy to production environment:

```sh
npm run deploy:prod:hosting
```

Both steps will remove the build folder, rebuild and deploy, using `firebase cli tools`. You must ensure that Firebase is installed globally (`npm i -g firebase-tools`).

Read more about [Firebase](https://firebase.google.com/) and initialising [here](https://firebase.google.com/docs/cli).

## System Architecture

React is setup using [Create React App](https://facebook.github.io/create-react-app/docs/getting-started).

> You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
>
> To learn React, check out the [React documentation](https://reactjs.org/).

## Development env

- [ ] npm > `6.1.0`
- [ ] node v 10 - [lts/dubnium](https://scotch.io/tutorials/whats-new-in-node-10-dubnium)
- [ ] see [`.eslintrc`](./.eslintrc) in the various packages for linting rules

Node version is set in node version manager [`.nvmrc`](https://github.com/creationix/nvm#nvmrc)

<!-- TODO: Setup eslint in express server -->

## Documentation

See [docs](./docs) folder

- [`docs/features-list`](./docs/features-list.md) overview of main features of the app.
- [`docs/user-journey/user-journey.md`](./docs/user-journey/user-journey.md) overview of main features of the app.
- [`docs/notes/`](./docs/notes/) contains unsorted dev notes on various aspects of the project (think of it as drafts).
- [`docs/guides/`](./docs/guides/) contains good to know/how to on various aspects of the project.
- [`docs/adr/`](./docs/adr/) contains [Architecture Decision Record](https://github.com/joelparkerhenderson/architecture_decision_record).

> An architectural decision record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

We are using [this template for ADR](https://gist.github.com/iaincollins/92923cc2c309c2751aea6f1b34b31d95)

<!--
[There also QA testing docs](./docs/qa/README.md) to manual test the component before a major release, (QA testing does not require any technical knowledge). -->

## Build

```sh
npm run build
```

Build of react client side will be in `build`

> Builds the app for production to the `build` folder.<br>
> It correctly bundles React in production mode and optimizes the build for the best performance.
>
> The build is minified and the filenames include the hashes.<br>
> Your app is ready to be deployed!

## Tests

Test coverage using [`jest`](https://jestjs.io/), to run tests

```sh
npm run test
```

During development you can use

```
npm run test:watch
```

> Launches the test runner in the interactive watch mode.<br>
> See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

<!-- See README for individual packages for more details -->

<!-- ## Travis CI

On commit this repo uses the [.travis.yml](./.travis.yml) config tu run the automated test on [travis CI](https://travis-ci.org/bbc/react-transcript-editor). -->

## Deployment

```
npm run publish:public
```

<!-- See README for individual packages for more details -->

for more info on Create React app deployment:

> See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) guidelines.

## Licence

<!-- mention MIT Licence -->

See [LICENCE](./LICENCE.md)

## Legal Disclaimer

_Despite using React and DraftJs, the BBC is not promoting any Facebook products or other commercial interest._
