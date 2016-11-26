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
    $("#contractAddress").value = contract;
    $("#methodId").value = method;

    var idText = "Contract: " + contract + "<br>Method: " + method;
    $("#contract_method_details").html(idText);

    // TODO actually make sure that we know about this contract within TAP. If not display an error.
}

function submitNewAttestation() {
    // Called when someone submits the attestation form.
    let attestationObj = {"attestation":{}};
    let att = attestationObj["attestation"];

    att["attestorAddress"] = web3.eth.accounts[0];
    att["transactionIdentifier"] = {};
    att["transactionIdentifier"]["functionId"] = $("#methodId").value;
    att["description"] = $("#attDescription").value;
    att["throws"] = document.getElementById("throwDescription").value.split("\n");
    att["callsExternal"] = $("#callsExternal").is(':checked');
    att["externalCalls"] = document.getElementById("externalCallDescriptions").value.split("\n");
    att["usesGas"] = $("#usesGas").is(':checked');
    att["acceptsETH"] = $("#acceptsETH").is(':checked');
    att["sendsYouETH"] = $("#sendsYouETH").is(':checked');
    att["updatesAssetOwnership"] = $("#updatesAssetOwnership").is(':checked');
    att["hasExploits"] = $("#hasExploits").is(':checked');
    att["exploits"] = document.getElementById("exploitDescriptions").value.split("\n");
    att["risk"] = document.getElementById("safety").value;

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

            writeIPFSFile(fullAttestationString, function(err, ipfsData) {
                if (err) {
                    console.log("ERROR writing to IPFS: " + err);
                } else {
                    let ipfsHash = ipfsData["hash"];
                    console.log("Wrote to IPFS at hash: " + hash + " full value is: " + ipfsData);
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

window.onload = function() {
    ipfs = IpfsApi();
    addCheckBoxListeners();

    // Referenced in app.js
    var contract = getParameterByName("contract");
    var method = getParameterByName("method");

    verifyContract(contract, method);
}
