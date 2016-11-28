var networkId;
var method;
var contract;
var tap;
var accounts;
var account;

function addCheckBoxListeners() {
    $("#hasExploits").click(function() {
        $("#exploitDescriptionDiv").toggle(this.checked);
    });

    $("#callsExternal").click(function() {
        $("#externalCallDescriptionDiv").toggle(this.checked);
    });

    $("#throws").click(function() {
        $("#throwDescriptionDiv").toggle(this.checked);
    });
}

function verifyContract(contract, method) {
    $("#contractAddress").val(contract);
    $("#methodId").val(method);

    var idText = "Contract: " + contract + "<br>Method: " + method;
    $("#contract_method_details").html(idText);

    // TODO actually make sure that we know about this contract within TAP. If not display an error.
}

function textAreaToArray(elementId) {
    let val = document.getElementById(elementId).value;
    if (val === "") {
        return [];
    } else {
        return val.split("\n");
    }
}

function submitNewAttestation() {
    // Called when someone submits the attestation form.
    let attestationObj = {"attestation":{}};
    let att = attestationObj["attestation"];

    att["attestorAddress"] = web3.eth.accounts[0];

    att["transactionIdentifier"] = {};
    att["transactionIdentifier"]["functionId"] = $("#methodId").val();
    att["transactionIdentifier"]["contractAddress"] = $("#contractAddress").val();
    att["transactionIdentifier"]["networkId"] = networkId;
    att["transactionIdentifier"]["transactionSignature"] = getTransactionSignatureFromId(contract, method);

    att["description"] = $("#attDescription").val();
    att["callsExternal"] = $("#callsExternal").is(':checked');
    att["usesGas"] = $("#usesGas").is(':checked');
    att["acceptsETH"] = $("#acceptsETH").is(':checked');
    att["sendsYouETH"] = $("#sendsYouETH").is(':checked');
    att["updatesAssetOwnership"] = $("#updatesAssetOwnership").is(':checked');
    att["hasExploits"] = $("#hasExploits").is(':checked');
    att["risk"] = $("#safety").val();

    let exploitSeverity = $("#exploitSeverity").val();
    let exploitDescriptions = document.getElementById("exploitDescriptions").value;

    if (exploitDescriptions === "") {
        att["exploits"] = [];
    } else {
        att["exploits"] = [{"severity" : exploitSeverity, "description" : exploitDescriptions}];
    }
    
    att["throws"] = textAreaToArray("throwDescription");
    att["externalCalls"] = textAreaToArray("externalCallDescriptions");
    
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
    //ipfs = IpfsApi();
    ipfs.setProvider();
    addCheckBoxListeners();

    // Referenced in app.js
    contract = getParameterByName("contract");
    method = getParameterByName("method");

    verifyContract(contract, method);

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

    getNetwork();
}
