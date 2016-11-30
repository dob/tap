

var contractAddr;
var contractCode;
var sampleContract = "contract mortal {\n    address owner;\n\n    function mortal() { owner = msg.sender; }\n\n}\n\ncontract greeter is mortal {\n    string greeting;\n\n    function greeter(string _greeting) public {\n        greeting = _greeting;\n    }\n\n    function greet() constant returns (string) {\n        return greeting;\n    }\n}";
var sampleAddr = "0x7dfb4afd15c05c9dadbe92ff1183672eed510f74";


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

    $.post("http://strato-dev2.blockapps.net/eth/v1.0/solc", { src: contractCode},
        function( data ) {
          // console.log( data );
          $("#compileError").hide();

          var jsonData = JSON.parse(data);
          if (jsonData["error"] != null) {
            error(jsonData["error"]);
          } else {
            var content = "";
            var counter;
            for(counter = 0; counter < jsonData["abis"].length; counter++) {
                abi = jsonData["abis"][counter];
                contract = jsonData["contracts"][counter];
                content += "<div id='contract_" + abi["name"] + "' style='margin:10px'>" + 
                    "<label style='font-style:italic'>" + abi["name"] + "</label>" + "<br/>" + 
                    "<label>Interface: </label>" + "<input readonly='readonly' value='" + JSON.stringify(abi["abi"]) + "'></input>" + 
                    "<label>Bytecode: </label>" + "<input readonly='readonly' value='" + contract["bin"] + "'></input>" +
                    "</div>";
            }
            content = "<div>Solc Compile Result</div>" + content;
            $("#compileResult").html(content);

            compiledContracts = jsonData["contracts"];
            // console.log("Calling verify: " + byteCode + JSON.stringify(compiledContracts));
            verifyCode(compiledContracts, byteCode);
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
        error("Contract bytecode mismatch. Cannot verify contract at Address: " + getContractAddr());
    } else {
        alert("Found a match!  Verificatoin success!");
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

    // getNetwork();
}
