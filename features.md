https://github.com/kossidts/docsify-live-demo
https://github.com/tngan/samlify/tree/master/docs
https://samlify.js.org/

// use this to deconstruct query to make them faster
.books.useParams({ id }).find((w, params) => w.id === params.id);

How can we make cache work?  We need params.

Alternate solution
1. If cache is on, all functions return every document, cache it, then use the selector to act on all documents. we no longer need a cache key when there is no TTL.
2. If we are using a TTL Cache, we need a key and a TTL because we are trying to expire something

2.0 
1. Make queries faster
2. Use Schemas only



