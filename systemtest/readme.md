
Overview
========

In order to test the system-level of bridge47, you need:

1. The bridge47 system up at AWS.
1. A workstation outside the VPC that is running bridge47.

System-level tests
------------------

| Script | Description |
| ------ | ----------- |
| run-b47test-instances | Deploy instances that `test-stack-routing` can test against. |
| test-stack-routing | Tests that requests will be routed to the right service, and color. |
| some-other-test    | Another test. |

Deploying Bridge47 Itself
=========================

When bridge47 changes, it must be tested. Basically, this means testing that the routing is
still working.

1. Make a new AMI
1. Deploy new instances to the test stack to act as `main` and `next` stack, and ensure that
   both internal and external routes end up at the correct instances.
 *  Stop instances when done.
1. Deploy new instances to the prod stack to act as a quasi- `main` and quasi- `next` stacks,
   and ensure that both internal and external routs end up at the correct instances.
 *  Stop instances when done.
1. Deploy new instances to the prod stack to act as the `staging` (aka `next` stack).
1. Test clients with the `staging` stack.
1. Cut-over to the `staging` stack.
 *  Monitor that the new prod (aka `main`) stack is working.
 *  Shutdown the old prod stack.

Make a New AMI
--------------

* Look to see if there is a new Ubuntu AMI at: https://cloud-images.ubuntu.com/locator/ec2/
 * Use `us-east hvm ebs-ssd amd64 lts` to search
 * The new Ubuntu AMIs go into `admin/build/build-instance`
* Then, build an AMI:

```
time build-instance
```

Deploy to Test and Test the Routing
-----------------------------------

* Deploy instances to test stacks.

```
run-b47test-instances
```

* Test from workstation
 * Make sure workstation is not behind a proxy

```
./systemtest/test-stack-routing
```

* Shut down instances

Deploy to Prod and Test the Routing
-----------------------------------

Assuming that the above test (deploying to test and tesing that routing), goes well,
test with instances running on prod, but in a way that does not interfere with
any current prod or staging stacks.

* Promote the just-tested AMI to production.

```
ra invoke "$(fnn ~/dev bridge47/lib/cluster-db\.js$)" promoteRunConfigAmi
```

* Deploy instances to prod stacks.

```
run-b47test-instances --stack=prod --webtier-color=blue
run-b47test-instances --stack=prod --webtier-color=teal
```

* Test from workstation
 * Make sure workstation is not behind a proxy

```
./systemtest/test-stack-routing --stack=prod
./systemtest/test-next-webtier-routing --next-color=blue
./systemtest/test-next-webtier-routing --next-color=teal
```


Cut-over to New Web-Tier
------------------------

* Once you are confident that the new web-tier is ready, cut-over to it.

```
ra invoke "$(fnn ~/dev bridge47/lib/cluster-db\.js$)" updateWebTier --stack=prod --color=blue
ra invoke "$(fnn ~/dev bridge47/lib/cluster-db\.js$)" updateWebTier --stack=prod --color=teal
```

* Then test that the cut-over worked.

```
./systemtest/test-stack-routing --stack=prod --hq-subdomain=b47hq --xapi-subdomain=b47xapi
./systemtest/test-webtier-routing --main-color=blue
./systemtest/test-webtier-routing --main-color=teal
```

* Test that other services are still working.

```
./systemtest/test-product-routing --product=ntl --service=telemetry --main-color=blue
./systemtest/test-product-routing --product=ntl --service=telemetry --main-color=teal
```

* Shut down all instances except the web-tier

Deploy New Production hq Server
-------------------------------

This is wonky.

This will run the instance, but there is no automated test at the moment.

```
run-hq-instance --stack=prod --color=blue
run-hq-instance --stack=prod --color=teal
```

