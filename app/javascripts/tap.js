var accounts;
var account;
var tap;       // our contract object
var ipfs;
var networkId;

function setStatus(message) {
    console.log(message);
};

function getValue(fieldId) {
    return document.getElementById(fieldId).value;
}

/**
 * @param addr The address of the contract to verify
 * @param hash The IPFS hash of the contract directory, which contains subfiles code, bytecode, abi, and metadata.json
 * @param name The user facing name of the contract
 */
function addContractVerification(addr, hash, name) {
    setStatus("Registering request for contract verification");
    
    tap.addContractVerification(addr, hash, name, {from:account, gas:200000}).then(function(txnId){
        setStatus("Completed contract verification. Now looking up this attestation at address: " + addr);
        tap.contractVerifications.call(addr).then(function(res) {
            console.log("Res is: " + res);
            setStatus("Finished getting verifications");
        });
    });
}


function addAttestation(addr, methodId, hash) {
    setStatus("Registering attestation");
    console.log("About to submit attestation for: " + [addr, methodId, hash]);
    tap.addAttestation(addr, methodId, hash, {from:account, gas:2000000}).then(function(txnId){
        setStatus("Completed contract verification");
    });
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

/**
 * @param callback function(err, attestationObject, signature) where attestationObject is the result of JSON parsing the attestation from IPFS. Signature is the signature hash of the attestation
 */
function renderContractDetails(contractAddr, methodId, callback) {
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

function getByteCodeCompileAndVerify(addr, contractCode) {
    console.log("Get ByteCode At: " + addr);
    web3.eth.getCode(addr, function(err, data) {
        if (err) {
            error("Cannot get code at address: " + addr);
        }

        console.log($("#contractBytecode").html);
        compileAndVerifyContract(data, contractCode);
    });
}

var compileAndVerifyContract = function(byteCode, contractCode) {

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

              verifyCode(compiledContracts, byteCode);

              // TODO, write the data to IPFS now that it's verified
          }
        }
    );
}

var verifyCode = function(compiledContracts, byteCode) {
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
        alert("Found a match!  Verificatoin success!");
        
    }
}

// ADDING NEW ATTESTATIONS

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

// Sign the sha3 hash of the JSON string of the att object
function signAttestation(att, callback) {
    let account = web3.eth.accounts[0];
    let hashToSign = web3.sha3(JSON.stringify(att));
    
    web3.eth.sign(account, hashToSign, function(err, res) {
        callback(err, res);
    });
}

function getNetwork() {
    web3.version.getNetwork(function (err, res) {
        if (!err) {
            networkId = res;
        }
    });
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
