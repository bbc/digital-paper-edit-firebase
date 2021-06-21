# Using stylesheets in our Firebase project

- Status: Accepted
- Deciders: Tamsin, Sarah, Alli, Anna
- Date: 2021-05-11

## Context and Problem Statement

So far, we have used inline styling for our Firebase project. Concerns have been raised that moving to using stylesheets would be inconsistent. We are moving into our final UX sprint, and have one PR open at this time where the use of stylesheets would make the code more readable. We think this will likely be the case for other features going forward. 

## Decision Outcome

We will add stylesheets for any components we refactor going forward. We will use SASS. 

## Decision Drivers
- Code quality / readability 
- We don't believe this will have other time-costing repercussions, like interfering with webpack 

## Considered Options
- Continuing to use inline styling 
- Adding stylesheets




