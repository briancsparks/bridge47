

download.js has the Node.js handlers for downloading from the telemetry store,
and the DB that runs things. Obviously, it was originally for downloads, but
now that the data flow has changed, many of the HTTP requests to it do not
get the data they asked for.

download.js has 4 functions:

* Request that sessions (and clients) get fetched from the db, but then be
  sent to someone else, not the requestor that brought the query.
* Requests for clients from the DB be sent to another recipient, like
  sessions.
* The original 'download' handler that returned a whole session's telemetry..
* A new 'download2' handler that receives a request from one entity, but
  gives the response to someone else.

Three Different Data Sets (so far)
==================================

1. The list of sessions from the database. This is a very run-of-the-mill
   payload response.
2. The telemetry from a given session. This data is very time-centric.
3. Attrstream


The Flow
========

1. Receiving the query. The modules mentioned above receive the HTTP request,
   and will drive the process to push the data back out.
2. Understand the query and fulfill it. Some requests require one (or more)
   data base queries, and some require fetching from S3.
3. The data may get manipulated at this point (like normalizing the data
   for the trip as a JSON response.)
4. A helper object (DataSet in feeder.js) helps by holding the query response
   while it is being fulfilled. It then handles the last step of sending
   the data to Redis.
4. Meanwhile, the real recipient connection has been held by feed.js. The
   data goes through Redis, and then eventyally to feed.js, and then on as
   the response.

Nuances
=======

The receiver of the data (the one that waits at feed.js) brings some
requirements (like the response must be JSON, or that the server should do the
heavy lifting converting the data. However, it is common for one client-side
loop to be the only one making the request to receive the out-of-synch
data movement. This entity cannot, therfore make the decisions about the
constrainsts on the response.

Other entities are making the requests, and they are the ones that know the
constratins on that one.


TODO
====

My Mac is at work, but that is what we use for the reverse proxy, so we need
to get nginx working -- either on a window box, or one of the ubuntu VMs.

Notes
=====

Dont change the addresses in /etc/hosts very often. If a device sees it in there,
it will assume that it can do whatever it wants.




