var accounts;
var account;
var tap;       // our contract object
var ipfs;
var networkId;

/**
 * Verify the contract at a given address with the code provided and write the result to TAP. This will enable people to submit attestations for this contract.
 * @param addr The contract address on the blockchain
 * @param contractCode The contract code as a string
 * @param solcVersion The version of solidity compiler solc used to compile the code on the blockchain
 * @param name The user friendly name you'd like to give the contract
 * @param callback function(err) that returns an error string if the contract failed to verify, and null if it verifies correctly.
 */
function verifyContract(addr, contractCode, solcVersion, name, callback) {
    console.log("Get ByteCode At: " + addr);
    web3.eth.getCode(addr, function(err, data) {
        if (err) {
            error("Cannot get code at address: " + addr);
        }

        console.log($("#contractBytecode").html);
        compileAndVerifyContract(data, contractCode, solcVersoin, function(err, res) {
            if (err) {
                callback("Could not verify contract");
            } else {
                let hash = res;
                // Write verified output to the blockchain
                tap.addContractVerification(addr, hash, name, {from:account, gas:200000}).then(function(txnId){
                    setStatus("Completed contract verification in txnId: " + txnID);
                    callback(null);
                });
            }
        });
    });
}

/**
 * Get the attestations for a given method within a contract.
 * @param contractAddr The address of the contract.
 * @param methodId The 0x prefixed method ID of the method you want attestations for. This is equal to sha3(method_signature) with comma separated types and unnamed parameters.
 * @param callback function(err, attestationObject, signature) where attestationObject is the result of JSON parsing the attestation from IPFS. Signature is the signature hash of the attestation. Callback will be invoked once per attestation.
 */
function getAttestations(contractAddr, methodId, callback) {
    setStatus("Fetching contract details");

    tap.getIdsForContract.call(contractAddr).then(function(res) {
        // Loop through each attestation
        console.log("Length of res is: " + res.length);
        for (let i = 0; i < res.length; i++) {
            tap.getAttestation.call(i).then(function(res) {
                console.log("Res is: " + res);
                var name = res[1];
                var method = res[5];
                var hash = res[3];
                var votes = res[4];

                // Looping through all attestations for this contract
                // so check if this one is for the correct method.
                if (method == methodId) {

                    readIPFSFile(hash, function(err, body) {
                        var attestation = JSON.parse(body);
                        var signature = attestation.attestation.transactionIdentifier.transactionSignature;
                        callback(null, attestation, signature);
                        setStatus("Contract details loaded");
                    });
                }
            });
        }
    });
}

/**
 * Add a new attestation for a given contract and method. It's best to use a convenience method that forms the schema correctly.
 * @param att Is a well formated attestation object according to the following schema (signature will be appended by the function):
 {
   "attestation":{
        "attestorAddress":"0x49740a68a9c42a0348042a3668c589c82136de82",
        "transactionIdentifier":{
            "functionId":"0xb9a2de3a",
            "contractAddress":"0x131bec75342a54ffea3087bda5ba720394c486a9",
            "networkId":"1999",
            "transactionSignature":"function placeholder(uint)"
        },
        "description":"The endAuction() ends the auction. If transfers ownership of the asset to the winning bidder if the reserve was hit, and back to the seller if it was not. It updates the withdrawl balances accordingly so people can withdraw the funds they're entitled to.",
        "callsExternal":true,
        "usesGas":true,
        "acceptsETH":false,
        "sendsYouETH":false,
        "updatesAssetOwnership":true,
        "hasExploits":true,
        "risk":"yellow",
        "exploits":[
            {
                "severity":"high",
                "description":"The function can be called with a full call stack multiple times, updating the withdrawl balance of the seller to be more than what they're entitled to."
            }
        ],
        "throws":["The auction isn't done.","The transfer of the asset to the new owner fails."],
        "externalCalls":["This will call setOwner() on the Asset contract which is specified in the auction. This can't be determined ahead of time, so it's up to you as the buyer to reference the sold item and verify the implementation of SetOwner in the item's asset implementation."]
    }
}
 *
 */
function submitNewAttestation(att) {
    // Called when someone submits the attestation form.
    let attestationObj = {"attestation": att};
    
    /** 
     * At this point we want to:
     *
     * 1. Sign the sha3 hash of the attestatation string using the 
     *    private key of the ETH account of the author
     * 2. Upload to IPFS
     * 3. Write the transaction into TAP
     */
    signAttestation(att, function(err, res) {
        if (!err) {
            attestationObj["signature"] = res;
            let fullAttestationString = JSON.stringify(attestationObj);
            console.log("Attestation is: " + fullAttestationString);

            writeIPFSJSON(attestationObj, function(err, ipfsData) {
                if (err) {
                    console.log("ERROR writing to IPFS: " + err);
                } else {
                    console.log("Wrote to IPFS at hash: " + ipfsData + " full value is: " + ipfsData);
                    console.log("Now creating on chain attestation.");
                    tap.addAttestation(contract, method, ipfsData, {from:account, gas:2000000}).then(function(txId) {
                        console.log("Finished creating on chain attestation");
                    });
                }
            });            
            
        } else {
            console.log("ERROR signing attestation: " + err);
        }
    });
}


// PRIVATE. All functions above here are meant to be invoked by users. Below are utilities and internal functions.

function getTransactionSignatureFromId(contract, method) {
    // TODO implement a lookup in a registry or in our known registrations
    // For now return a constant value

    return "function placeholder(uint)";
}

// IPFS Utilities

function readIPFSFile(hash, callback) {
    // Using the consensys IPFS library. Should look into the
    // catJSON and addJSON calls.
    ipfs.cat(hash, function(err, res) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res.toString());
        }
    });
}

// Takes string input 'data' and writes it to IPFS
function writeIPFSFile(data, callback) {
    ipfs.add(data, function(err, res) {
        // Res is a hash
        callback(err, res);
    });
}

// Takes a javascript object 'data', serializes it to JSON, and writes it to IPFS
function writeIPFSJSON(data, callback) {
    ipfs.addJson(data, function(err, res) {
        callback(err, res);
    });
}


// CONTRACT VERIFICATION
function error(str) {
    console.log("ERROR: " + str);
}

/**
 * Compiles the contract code and verifies that it matches the bytecode
 * @param bytecode The contract bytecode
 * @param contractCode The string representing the code
 * @param solcVersion The solc Version number
 * @param callback function(err, hash) where hash is the IPFS root of the contract metadata with subfiles /code, /abi, /metadata.json, /bytecode
 */
var compileAndVerifyContract = function(byteCode, contractCode, solcVersion, callback) {

    $.post("http://strato-dev2.blockapps.net/eth/v1.0/solc", { src: contractCode},
        function( data ) {

          var jsonData = JSON.parse(data);
          if (jsonData["error"] != null) {
            error(jsonData["error"]);
          } else {
            var content = "";
            var counter;
            for(counter = 0; counter < jsonData["abis"].length; counter++) {
                abi = jsonData["abis"][counter];
                contract = jsonData["contracts"][counter];
            }

            compiledContracts = jsonData["contracts"];

              verifyCode(compiledContracts, byteCode, function(err, res) {
                  if (err) {
                      callback("Could not verify contract", null);
                  } else {
                      
                      // TODO, write the data to IPFS now that it's verified, and return the hash.
                      let hash = ""; // Replace this with hash returned from IPFS
                      callback(null, hash);
                  }
              });
          }
        }
    );
}

var verifyCode = function(compiledContracts, byteCode, callback) {
    console.log("Verify code: " + JSON.stringify(compiledContracts));
    verified = false;
    for (idx in compiledContracts) {
        contractCode = compiledContracts[idx]["bin"];
        // console.log("Contract: " + contract);
        console.log("Chain code: " + byteCode);
        console.log("Contract code: " + contractCode);
        console.log("\n\n");
        if (byteCode == contractCode) {
            verified = true;
            break;
        }
    }

    if (verified == false) {
        error("Contract bytecode mismatch. Cannot verify contract at Address: ");
    } else {
        alert("Found a match!  Verification success!");
        // TODO, write the data to IPFS
    }
}


// ADDING NEW ATTESTATIONS

// Sign the sha3 hash of the JSON string of the att object
function signAttestation(att, callback) {
    let account = web3.eth.accounts[0];
    let hashToSign = web3.sha3(JSON.stringify(att));
    
    web3.eth.sign(account, hashToSign, function(err, res) {
        callback(err, res);
    });
}


// UTILITIES

function getNetwork() {
    web3.version.getNetwork(function (err, res) {
        if (!err) {
            networkId = res;
        }
    });
}

function setStatus(message) {
    console.log(message);
};

function getValue(fieldId) {
    return document.getElementById(fieldId).value;
}

// Utility function to parse URI params
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}



window.onload = function() {
    ipfs.setProvider();

    web3.eth.getAccounts(function(err, accs) {
        if (err != null) {
            alert("There was an error fetching your accounts.");
            return;
        }

        if (accs.length == 0) {
            alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
            return;
        }

        accounts = accs;
        account = accounts[0];

        tap = TAP.deployed();
    });
}
