contract('TAP', function(accounts) {
    it("should create and get an attestation", function() {
        var tap = TAP.deployed();
        var owner = accounts[0];
        var bounty = 50000;  // wei
        var contractAddress = "0x131bec75342a54ffea3087bda5ba720394c486a9";
        var ipfsHashForContract = "QmRuHqGQCRJBfzzeSV7HYBikHRRMNfjPuu3L7nzKuiEV7t";
        var ipfsHashForAttestation = "QmbNwzaqYLxh21hxs4NpPMQ6HNnDJnp4qChMKUpQVnA6bx";
        var functionId = 0xb9a2de3a;
        var author = accounts[1];
        
        return tap.addContractVerification(contractAddress, ipfsHashForContract, {from:owner, value:bounty}).then(function() {
            return tap.contractVerifications.call(contractAddress);
        }).then(function(ctr) {
            assert.equal(ctr[0], contractAddress, "Address didn't match");
            assert.equal(ctr[1], ipfsHashForContract, "IPFS Hash didn't match");
            assert.equal(ctr[2].toNumber(), bounty, "bounty did not match");

            return tap.addAttestation(contractAddress, functionId, ipfsHashForAttestation, {from:accounts[1], gas:2000000});
        }).then(function() {
            return tap.getAttestation.call(0);
        }).then(function(att) {
            console.log("Made it here: att is: " + att);
            assert.equal(att[1], contractAddress, "Contract address didn't match");
            assert.equal(att[2], author, "Author didn't match");
            assert.equal(att[3], ipfsHashForAttestation, "Hash didn't match");
            assert.equal(att[4], functionId, "Function ID didn't match");
        });
    });

    it("should be able to add to the bounty", function() {
        var owner = accounts[0];
        var bounty = 2 * Math.pow(10, 18);
        var contractAddress = "0x131bec75342a54ffea3087bda5ba720394c486a9";
        var ipfsHash = "QmRuHqGQCRJBfzzeSV7HYBikHRRMNfjPuu3L7nzKuiEV7t";

        return TAP.new().then(function(tap) {
            return tap.addContractVerification(contractAddress, ipfsHash).then(function() {
                return tap.addBounty(contractAddress, {value: bounty})
            }).then(function() {
                return tap.contractVerifications.call(contractAddress);
            }).then(function(ctr) {
                assert.equal(ctr[2].toNumber(), bounty, "Should have been able to add a bounty");
            });        
        });
    });
});
