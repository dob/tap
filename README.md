# Transaction Attestation Platform (TAP)

## Local setup

Running a full decentralized version of TAP requires running Ethereum
and IPFS.

The architecture of the app is that attestations are stored on IPFS,
and the hashes that represent them are stored into the contract. Users
can make verify any contracts code (also stored on IPFS), and then
other users can attest to the contracts.

### Setup Ethereum

Setup a local node on a local network to test against...

    geth --identity "dougnode" --datadir ~/.chaindata --networkid 1999 init configs/CustomGenesis.json
    geth --identity "dougnode" --rpc --rpcport "8545" --rpccorsdomain
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

    Douglass-iMac:tap dob$ ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8082
    Douglass-iMac:tap dob$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"*\"]"
    Douglass-iMac:tap dob$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials "[\"true\"]"
    Douglass-iMac:tap dob$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"http://localhost:8080\"]"
    Douglass-iMac:tap dob$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"

Run IPFS daemon

    Douglass-iMac:tap dob$ ipfs daemon

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


