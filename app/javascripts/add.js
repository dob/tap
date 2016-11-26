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
    
    console.log("Attestation is: " + JSON.stringify(attestationObj));
}

window.onload = function() {
    addCheckBoxListeners();

    // Referenced in app.js
    var contract = getParameterByName("contract");
    var method = getParameterByName("method");

    verifyContract(contract, method);
}
