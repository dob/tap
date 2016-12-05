# Transaction Attestation Platform (TAP)

TAP is an Ethereum + IPFS platform that lets users attest to what will
actually happen when users invoke certain functions within smart
contracts. For each function in a smart contract that's attested to,
users will get visibility into:

* a description of what is intended to happen
* are there any known exploits?
* does this function invoke other external smart contract functions?
* does it require ETH?
* does it send you ETH?
* does it transfer ownership of an asset controlled by your account?
* what may cause this function to throw and lose your gas?
* an overall risk assessment of signing that transaction
* and more. View full working schema
[for an attestation](https://github.com/dob/tap/blob/master/examples/attestation.json).

Without social attestations, users have very little transparency into
what will actually happen when they press that "Accept" button to sign
a transaction. With attestations they can use DApps with confidence.

The
[TAP smart contract](https://github.com/dob/tap/blob/master/contracts/TAP.sol)
documents the full on chain functionality, however the smart contract
only proves that attestations were provided by a given account, and
the attestation data itself lives on IPFS. As a result, we recommend
that you would use the JS interface in order to write out correct and
valid attesattions.

## JS Interface

[TAP.js](https://github.com/dob/tap/tree/master/app/javascripts)
provides the core interface for interacting with the TAP platform. It
provides the following functions.

`TAP.verifyContract(addr, contractCode, solcVersion, name, callback)`

Before you can provide attestations, the code for the contract must be
verified, and the request registered with TAP. Call `verifyContract`
if it hasn't been called yet for the contract within TAP.

`TAP.getAttestations(contractAddr, methodId)`

Get the known attestations for a given contract and methodId. MethoID
is the 0x prefixed 4 byte identifier constructed from sha3(function
signature).

`TAP.submitNewAttestation(att)`

Add a new attestation. This will require you to sign the attestation
object, and then sign the transaction on the blockchain. At the
moment, the attestation object is a JS object conforming to the
[attestation schema example](https://github.com/dob/tap/blob/master/examples/attestation.json)
but we'd like to add a helper method to make it easier to construct
this object.

`TAP.vote(attestationId)`

Coming soon...this is how you would vote on an attestation.

## Project status

TAP is a work in progress project proposed by
[Eric Tang](http://twitter.com/ericxtang) and
[Doug Petkanics](http://twitter.com/petkanics). We believe that this
only succeeds as a community driven project, since the major benefits
of TAP will be both provided by and delivered to the community. We'd
currently like feedback
[in the issues](https://github.com/dob/tap/issues) on attestation
schemas and on the mechanisms that bounties could be provided and
distributed to users for providing attestations.

Additionally, TAP will require a great frontend to display all the
great attestations that users have left, and to make it easy for users
to submit attestations. We have a working proof of concept frontend on
a branch, but if any aspiring DApp developers would like to get
involved in building out a community tool, please contact us. We'd
love to help get you involved.

## Local setup

Running a full decentralized version of TAP requires running Ethereum
and IPFS.

The architecture of the app is that attestations are stored on IPFS,
and the hashes that represent them are stored into the contract. Users
can make verify any contracts code (also stored on IPFS), and then
other users can attest to the contracts.

### Setup Ethereum

Setup a local node on a local network to test against...

    geth --identity "yournode" --datadir ~/.chaindata --networkid 1999 init configs/CustomGenesis.json
    geth --identity "yournode" --rpc --rpcport "8545" --rpccorsdomain
    "*" --datadir ~/.chaindata/ --port "30303" --rpcapi
    "db,eth,net,web3,personal" --networkid 1999 console

Create an account, unlock it, and start mining.

    personal.newAccount()
    personal.unlockAccount(eth.accounts[0])
    miner.setEtherbase(eth.accounts[0])
    miner.start()

### Setup IPFS

Since the app is served on port 8080 by default, as is IPFS, you'll
want to change some IPFS config vals. I'm running on port 8082

    $ ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8082
    $ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"*\"]"
    $ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\"true\"]"
    $ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:8080\"]"
    $ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"

Run IPFS daemon

    $ ipfs daemon

Add files in the examples directly to IPFS and note the resulting
hashes

    cd examples
    ipfs add *


### Serve the DApp locally

    truffle build
    truffle migrate --reset
    truffle serve

You can now access the app at `http://localhost:8080` were you can
register contracts and attestations. You can then access attestations
at `http://localhost:8080/attestations.html?contract=<contractAddress>&method=<methodId>`.


