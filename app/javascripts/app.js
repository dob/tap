var accounts;
var account;
var tap;       // our contract object

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
    tap.addAttestation(addr, methodId, hash, {from:account, gas:600000}).then(function(txnId){
        setStatus("Completed contract verification");
    });
}

window.onload = function() {
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
