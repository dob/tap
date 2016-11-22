pragma solidity ^0.4.4;

contract TAP {

    struct Attestation {
        uint id;
        address contractAddress;
        bytes4 methodId;
        address attestorAddress;
        string attestationIPFSHash;
        bool exists;

        // Votes
        uint voteCount;
        mapping (address => bool) addressVoted;
        address[] usersWhoVoted;
    }

    struct Contract {
        address contractAddress;
        string verificationIPFSHash;
        string name;
        bool exists;
    }

    // All known verified contracts to be attested to
    mapping (address => Contract) public contractVerifications;   

    // All known attestations
    Attestation[] public attestations;

    // Attestations for a given contract address
    mapping (address => Attestation[]) public attestationsForContract;

    // Attestations ids for a given contract. Helpful for looping through attestations
    // from outside of this contract.
    mapping (address => uint[]) public idsForContract;

    // All known attestations for a given user
    mapping (address => Attestation[]) public attestationsForUser;

    address owner;
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            throw;
        }
        _;        
    }
    
    function TAP() {
        owner = msg.sender;
    }

    function addContractVerification(address _addr, string _ipfsHash, string _name) returns (bool) {
        // Check to see if there already is a verification for this contract
        if(contractVerifications[_addr].exists == true) {
            return false;
        }

        Contract c = contractVerifications[_addr];
        c.contractAddress = _addr;
        c.verificationIPFSHash = _ipfsHash;
        c.name = _name;
        c.exists = true;
        contractVerifications[_addr] = c;
        
        return true;
    }

    function addAttestation(address _contractAddress, bytes4 _methodId, string _ipfsHash) returns (bool) {
        Attestation a = attestations[attestations.length++];
        a.id = attestations.length - 1;
        a.contractAddress = _contractAddress;
        a.methodId = _methodId;
        a.attestorAddress = msg.sender;
        a.attestationIPFSHash = _ipfsHash;
        a.exists = true;

        // Vote count starts at one because you vote for yourself
        a.voteCount = 1;
        a.addressVoted[msg.sender] = true;
        a.usersWhoVoted.push(msg.sender);

        // TODO: These indexes apparently don't get their values updated
        // when the attestations[] value gets updated. Instead they should probably just
        // be references to the attestation.id/index into attesations[] instead of
        // references
        attestationsForContract[_contractAddress].push(a);
        idsForContract[_contractAddress].push(a.id);
        attestationsForUser[msg.sender].push(a);
        
        return true;
    }

    function vote(uint _attestationId) returns (bool) {
        Attestation a = attestations[_attestationId];

        // If user already voted return false
        if (a.addressVoted[msg.sender] == true) {
            return false;
        }

        a.voteCount++;
        a.addressVoted[msg.sender] = true;
        a.usersWhoVoted.push(msg.sender);

        return true;
    }

    // Warning...this is unsafe if there are a LOT of votes.
    // The function may run out of gas before resetting the state.
    // Unfortunately we have to loop through the usersWhoVoted array, which
    // can run out of gas in a transaction.
    function unvote(uint _attestationId) returns (bool) {
        Attestation a = attestations[_attestationId];

        // If a user hasn't voted return false
        if (a.addressVoted[msg.sender] == false) {
            return false;
        }

        a.voteCount--;
        a.addressVoted[msg.sender] = false;

        int j = -1;
        for (uint i = 0; i < a.usersWhoVoted.length; i++) {
            if (j > -1 ) {
                a.usersWhoVoted[i - 1] = a.usersWhoVoted[i];
            }
            
            if (a.usersWhoVoted[i] == msg.sender) {
                j = int(i);
            }
        }

        delete a.usersWhoVoted[a.usersWhoVoted.length - 1];
        a.usersWhoVoted.length--;
        return true;
    }

    // This return signature is giving major problems. It works in this order, but
    // bytes4 seems to be screwing something up, as anything that comes after it doesn't
    // get returned correctly. It seems to work if that's the last return val.
    function getAttestation(uint id) returns (uint, address, address, string, uint, bytes4) {
        if (id >= attestations.length) {
            return;
        } else  {
            Attestation a = attestations[id];
            return (a.id,
                    a.contractAddress,
                    a.attestorAddress,
                    a.attestationIPFSHash,
                    a.voteCount,
                    a.methodId);
        }
    }

    function getIdsForContract(address _contractAddress) returns (uint[]) {
        return idsForContract[_contractAddress];
    }

    function getAttestationCountForUser(address _user) returns (uint) {
        return attestationsForUser[_user].length;
    }

    // Right now reputation is just the raw data of how many attestations this user has written and
    // how many collective votes their attestations have received
    function getUserReputation(address _user) returns (uint numberOfAttestations, uint numberOfVotes) {
        Attestation[] userAttestations = attestationsForUser[_user];
        numberOfAttestations = userAttestations.length;

        // Looping through the userAttestations array doesn't work, as it seems
        // that when an attestation gets updated, the copy stored in this
        // array is not updated? Maybe the struct is copied on push() instead of
        // being a reference?
        //
        // Instead get the ID, index into attestations, and return votecount
        /* for (uint i = 0; i < numberOfAttestations; i++) {
            numberOfVotes += userAttestations[i].voteCount;
            }*/

        for (uint i = 0; i < numberOfAttestations; i++) {
            numberOfVotes += attestations[userAttestations[i].id].voteCount;
        }
                
        return (numberOfAttestations, numberOfVotes);
    }

    // Do not send ether to this contract blindly
    function () {
        throw;
    }
}

// In trying to identify the function and match up attestations with verified code,
// this reference for the ABIs is helpful: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI

// First four bytes of the SHA3 hash of the function signature are the first four bytes of the
// signed transaction data. Parameter types are split by a single comma with no spaces.
// So to compute this for function bidOnRecord(string recordId) returns (bool success),
// you would use bytes4(sha3("bidOnRecord(string)"))

// Also, should think about signing the attestation using the ethereum address private key
// which can then be verified to establish a link between the author and the attestation.
// http://ethereum.stackexchange.com/questions/1777/workflow-on-signing-a-string-with-private-key-followed-by-signature-verificatio/1794#1794
