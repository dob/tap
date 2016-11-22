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
}

window.onload = function() {
    addCheckBoxListeners();

    // Referenced in app.js
    var contract = getParameterByName("contract");
    var method = getParameterByName("method");

    verifyContract(contract, method);
}
