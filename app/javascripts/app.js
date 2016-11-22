var accounts;
var account;
var tap;       // our contract object
var ipfs;

function setStatus(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
};

function sendCoin() {
    var meta = MetaCoin.deployed();

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    setStatus("Initiating transaction... (please wait)");

    meta.sendCoin(receiver, amount, {from: account}).then(function() {
        setStatus("Transaction complete!");
        refreshBalance();
    }).catch(function(e) {
        console.log(e);
        setStatus("Error sending coin; see log.");
    });
};

function getValue(fieldId) {
    return document.getElementById(fieldId).value;
}

function addContractVerification() {
    var addr = getValue("contractAddress");
    var hash = getValue("contractIPFSHash");
    var name = getValue("contractName");

    setStatus("Registering request for contract verification");
    
    tap.addContractVerification(addr, hash, name, {from:account, gas:200000}).then(function(txnId){
        setStatus("Completed contract verification. Now looking up this attestation at address: " + addr);
        tap.contractVerifications.call(addr).then(function(res) {
            console.log("Res is: " + res);
            setStatus("Finished getting verifications");
        });
    });
}

function addAttestation() {
    var addr = getValue("attestationContractAddress");
    var methodId = getValue("methodId");
    var hash = getValue("attestationIPFSHash");

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

function renderContractDetails(contractAddr, methodId) {
    setStatus("Fetching contract details");
    var attestationArea = document.getElementById("methodAttestation");

    tap.getIdsForContract.call(contractAddr).then(function(res) {
        // Loop through each attestation
        for (var i = 0; i < res.length; i++) {
            tap.getAttestation.call(res[i]).then(function(res) {
                var name = res[1];
                var method = res[5];
                var hash = res[3];
                var votes = res[4];

                // Looping through all attestations for this contract
                // so check if this one is for the correct method.
                if (method == methodId) {
                    document.getElementById("contractName").innerHTML = name;
                    document.getElementById("methodId").innerHTML = method;

                    attestationArea.innerHTML += "<br>Attestation at <a href='http://127.0.0.1:8082/ipfs/" + hash + "'>" + hash + "</a>";

                    readIPFSFile(hash, function(err, body) {
                        var attestation = JSON.parse(body);
                        var signature = attestation.attestation.transactionIdentifier.transactionSignature;
                        attestationArea.innerHTML += "<br>For function: " + signature + "<br>Votes: " + votes + "<br>" + renderAttestation(attestation);
                        setStatus("Contract details loaded");
                    });
                }
            });
        }
    });
}

function readIPFSFile(hash, callback) {
    var body = '';
    ipfs.files.get(hash, function(err, res) {
        if (err) {
            callback(err, null);
        }

        res.on('data', (chunk) => {
            chunk.content.on('data', (data) => {
                var text = data.toString();
                body += text;
            });

            chunk.content.on('end', () => {
                callback(null, body);
            });
        });
    });
}

function renderAttestation(attestation) {
    var att = attestation.attestation;

    var body = '<table id="attestationTable">';

    body += tableRow("Author", att.attestorAddress);
    body += tableRow("Risk", att.risk);
    body += tableRow("Description", att.description);
    body += tableRow("Known Exploits", att.hasExploits);
    body += tableRow("Accepts ETH", att.acceptsETH);
    body += tableRow("Sends you ETH", att.sendsYouETH);
    body += tableRow("Uses Gas", att.usesGas);
    body += tableRow("Updates Asset Ownership", att.updatesAssetOwnership);
    body += tableRow("Calls external contracts", att.callsExternal);

    var exploitDescriptions = '';
    for (var i = 0; i < att.exploits.length; i++) {
        var exploit = att.exploits[i];
        exploitDescriptions += exploit.severity + ": " + exploit.description + "<br>";
    }

    body += tableRow("Exploit descriptions", exploitDescriptions);

    var throwDescriptions = "";
    for (var i = 0; i < att.throws.length; i++) {
        throwDescriptions += att.throws[i] + "<br>";
    }

    body += tableRow("Known throws", throwDescriptions);

    var externalCalls = "";
    for (var i = 0; i < att.externalCalls.length; i++) {
        extCall = att.externalCalls[i];
        externalCalls += "Contract: " + extCall.contractAddress + "<br>Function: " + extCall.signature + "<br><br>";
    }

    body += tableRow("External calls", externalCalls);
    
    body += "</table>";
    
    return body;
}

function tableRow(label, val) {
    return "<tr><td class='trlabel'>" + label + "</td><td class='trvalue'>" + val + "</td></tr>";
}

function setupContractPage() {
    var contractAddr = getParameterByName("contract");
    var methodId = getParameterByName("method");

    if (contractAddr && methodId) {
        renderContractDetails(contractAddr, methodId);
    }
}

window.onload = function() {
    ipfs = IpfsApi();

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

        setupContractPage();
        
    });

}
