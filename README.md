bridge47
========

All the layer-4 and layer-7 stuff you need so you can just write your code for the cloud.

Overview
========

Writing a hybrid client-and-cloud app is getting a lot easier, but there is still one aspect
that remains very difficult -- the networking stuff that connects the client and the server.
blah, blah, blah.

The idea is that a developer would only need to write the _code_ for thier hybrid app, and all
the network-level issues between the client and the code running in the cloud is already taken
care of. And done in a way that is completely out of the way, so the developer can take advantage
of everything that AWS and other could providers offer.

Features
========

* Client startup and configure
 * Starting the client library makes it fetch startup options from the cloud automatically.
* Routing and blue-green deployments
* Quick project startup
 * No domain name worries
 * No DB setup
* Service / app URL namespace sharing


Client Startup and Configure
----------------------------

You call `start_client()`, and the response is JSON that has startup configuration data
for your app. Use it to:

* Provide your app startup configuration information
 * Enable feature flags
* Do A/B testing
* Send developers to the integration stack
* Send QA testers to the qa/test stack
* Send end-users to the prod stack

Routing and Deployments
-----------------------

Automatic blue-green deployments


Project Layout
==============

Stuff that is Common to CC and Node Instances
---------------------------------------------

All the stuff in `lib` and `bin` is common.

Stuff that Runs on CC (Admin)
-----------------------------

All the stuff that runs on the command-and-control server (the admin server)
is in the admin dir.

* Creating a stack
 * Creates 2 VPCs and peers them
* Building a base instance (build-instance)
 * A little more gets put onto each instance, but this is what builds the
   snapshot.
* Running an instance (run-xyz-instance)
* Terminating an instance (terminate-instance)


Stuff that Runs on Each Node
----------------------------

* The `agent` gets run on each node.
* the `bridge47-plugins` get run on each node.


