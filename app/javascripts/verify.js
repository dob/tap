

var contractAddr;
var contractCode;
var sampleContract = "pragma solidity ^0.4.2;\n\ncontract mortal {\n    /* Define variable owner of the type address*/\n    address owner;\n\n    /* this function is executed at initialization and sets the owner of the contract */\n    function mortal() { owner = msg.sender; }\n\n    /* Function to recover the funds on the contract */\n    // function kill() { if (msg.sender == owner) selfdestruct(owner); }\n}\n\ncontract greeter is mortal {\n    /* define variable greeting of the type string */\n    string greeting;\n\n    /* this runs when the contract is executed */\n    function greeter(string _greeting) public {\n        greeting = _greeting;\n    }\n\n    /* main function */\n    function greet() constant returns (string) {\n        return greeting;\n    }\n}";

var sampleAddr = "0x0fc607602fac86c69d3b442592e8348e2a927a79";


function error(str) {
  $("#compileError").html(str);
  $("#compileError").show();
}

function getContractAddr() {
    return $("#contractAddress").val();
}

function getContractCode() {
    return $("#contractCode").val();
}

function getSolcVersion() {
    return $("#versions").val();
}

function getByteCodeCompileAndVerify(addr) {
    console.log("Get ByteCode At: " + addr);
    web3.eth.getCode(addr, function(err, data) {
        if (err) {
            error("Cannot get code at address: " + addr);
        }

        var contractCodeDiv = "<div>Bytecode At: " + addr + "</div><textarea id='contractBytecodeText' style='height:200px; width:508px; margin-left:10px; margin-top:10px'/>";
        console.log($("#contractBytecode").html);
        $("#contractBytecode").html(contractCodeDiv);
        $("#contractBytecodeText").val(data);
        compileAndVerifyContract(data);
    });
}

var compileAndVerifyContract = function(byteCode) {
    contractCode = getContractCode();

    BrowserSolc.loadVersion(getSolcVersion(), function(compiler) {
        optimize = 1;
        result = compiler.compile(getContractCode(), optimize);
        console.log(result);
        var content = "";
        var counter;
        contracts = Object.keys(result["contracts"]);
        for(counter = 0; counter < contracts.length; counter++) {
            name = contracts[counter];
            console.log(name);
            compilerOutput = result["contracts"][name];
            // contract = result["contracts"][counter];
            content += "<div id='contract_" + name + "' style='margin:10px'>" + 
                "<label style='font-style:italic'>" + name + "</label>" + "<br/>" + 
                "<label>Interface: </label>" + "<input readonly='readonly' value='" + compilerOutput["interface"] + "'></input>" + 
                "<label>Bytecode: </label>" + "<input readonly='readonly' value='" + compilerOutput["bytecode"] + "'></input>" +
                "</div>";
        }
        content = "<div>Solc Compile Result</div>" + content;
        $("#compileResult").html(content);

        // compiledContracts = jsonData["contracts"];
        // verifyCode(compiledContracts, byteCode);

    });
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
        error("Contract bytecode mismatch. Cannot verify contract at Address: " + getContractAddr());
    } else {
        alert("Found a match!  Verificatoin success!");
    }
}

function populateVersions(versions) {
    sel = document.getElementById("versions");
    sel.innerHTML = "";

    for(var i = 0; i < versions.length; i++) {
        var opt = document.createElement('option');
        opt.appendChild( document.createTextNode(versions[i]) );
        opt.value = versions[i]; 
        sel.appendChild(opt); 
    }
}

window.onload = function() {
    ipfs.setProvider();

    $("#compileButton").click(function() {
        compileContract();
    });

    $("#verifyButton").click(function() {
        getByteCodeCompileAndVerify(getContractAddr());
    });

    $("#compileError").hide();

    $("#contractAddress").val(sampleAddr);

    $("#contractCode").val(sampleContract);

    web3.version.getNetwork(function (err, res) {
        if (!err) {
            console.log(res);
        }
    });

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


    BrowserSolc.getVersions(function(soljsonSources, soljsonReleases){
        populateVersions(soljsonSources);
    });
    // getNetwork();
}
