contract('TAP', function(accounts) {
    it("should create and get an attestation", function() {
        var tap = TAP.deployed();
        var owner = accounts[0];
        var contractAddress = "0x131bec75342a54ffea3087bda5ba720394c486a9";
        var ipfsHashForContract = "QmRuHqGQCRJBfzzeSV7HYBikHRRMNfjPuu3L7nzKuiEV7t";
        var ipfsHashForAttestation = "QmbNwzaqYLxh21hxs4NpPMQ6HNnDJnp4qChMKUpQVnA6bx";
        var functionId = 0xb9a2de3a;
        var author = accounts[1];
        
        return tap.addContractVerification(contractAddress, ipfsHashForContract, "AuctionHouse", {from:owner}).then(function() {
            return tap.contractVerifications.call(contractAddress);
        }).then(function(ctr) {
            assert.equal(ctr[0], contractAddress, "Address didn't match");
            assert.equal(ctr[1], ipfsHashForContract, "IPFS Hash didn't match");

            return tap.addAttestation(contractAddress, functionId, ipfsHashForAttestation, {from:accounts[1], gas:2000000});
        }).then(function() {
            return tap.getAttestation.call(0);
        }).then(function(att) {
            console.log("Made it here: att is: " + att);
            assert.equal(att[1], contractAddress, "Contract address didn't match");
            assert.equal(att[2], author, "Author didn't match");
            assert.equal(att[3], ipfsHashForAttestation, "Hash didn't match");
            assert.equal(att[5], functionId, "Function ID didn't match");
        });
    });

    it("should have proper voting and reputation functionality", function() {
        return TAP.new().then(function(tap) {
            var owner = accounts[0];
            var voter1 = accounts[1];
            var voter2 = accounts[2];
            var contractAddress = "0x131bec75342a54ffea3087bda5ba720394c486a9";
            var ipfsHashForContract = "QmRuHqGQCRJBfzzeSV7HYBikHRRMNfjPuu3L7nzKuiEV7t";
            var ipfsHashForAttestation = "QmbNwzaqYLxh21hxs4NpPMQ6HNnDJnp4qChMKUpQVnA6bx";
            var functionId = 0xb9a2de3a;
            var author = accounts[3];
            var attId = 0;  // This will be attestation id 0, since it's the only one created in the new contract

            
            return tap.addContractVerification(contractAddress, ipfsHashForContract, "AuctionHouse", {from:owner}).then(function() {
                return tap.addAttestation(contractAddress, functionId, ipfsHashForAttestation, {from: author, gas:2000000});
            }).then(function() {
                return tap.vote(attId, {from:voter1, gas: 2000000});
            }).then(function() {
                return tap.vote(attId, {from:voter2, gas: 2000000});
            }).then(function() {
                return tap.getAttestation.call(attId);
                
                //return tap.attestationsForContract.call(contractAddress, 0);
            }).then(function(att) {
                console.log("Right now att is: " + att);
                assert.equal(att[4].toNumber(), 3, "Should have three votes at this point.");

                // Duplicate vote
                return tap.vote(attId, {from:voter1, gass: 2000000});
            }).then(function() {
                return tap.getAttestation.call(attId);
            }).then(function(att) {
                assert.equal(att[4].toNumber(), 3, "Should not have gotten a duplicate vote");

                // Unvote
                return tap.unvote(attId, {from: voter2, gas:2000000});
            }).then(function() {
                return tap.getAttestation.call(attId);
            }).then(function(att) {
                assert.equal(att[4].toNumber(), 2, "Should only have two votes now.");

                // User rep
                return tap.getUserReputation.call(author);
            }).then(function(rep) {
                assert.equal(rep[0].toNumber(), 1, "User has written one attestation");
                assert.equal(rep[1].toNumber(), 2, "User has two combined votes.");
            });
        });
    });
});
