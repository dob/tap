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
    }

    struct Contract {
        address contractAddress;
        string verificationIPFSHash;
        string name;
        bool exists;
    }

    mapping (address => Contract) public contractVerifications;
    mapping (address => Attestation[]) public attestationsForContract;
    mapping (address => uint[]) public idsForContract;
    
    Attestation[] public attestations;

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

        attestationsForContract[_contractAddress].push(a);
        idsForContract[_contractAddress].push(a.id);
        
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

        return true;
    }

    // This return signature is giving major problems. It works in this order, but
    // bytes4 seems to be screwing something up, as anything that comes after it doesn't
    // get returned correctly. It seems to work if that's the last return val.
    function getAttestation(uint id) returns (uint, address, address, string, bytes4) {
        if (id >= attestations.length) {
            return;
        } else  {
            Attestation a = attestations[id];
            return (a.id,
                    a.contractAddress,
                    a.attestorAddress,
                    a.attestationIPFSHash,
                    a.methodId);
        }
    }

    function getIdsForContract(address _contractAddress) returns (uint[]) {
        return idsForContract[_contractAddress];
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
