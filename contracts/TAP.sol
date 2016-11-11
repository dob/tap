pragma solidity ^0.4.4;

contract TAP {

    struct Attestation {
        uint256 id;
        address contractAddress;
        bytes4 methodId;
        address attestorAddress;
        string attestationIPFSHash;
        bool exists;
    }

    struct Contract {
        address contractAddress;
        string verificationIPFSHash;
        uint256 bounty;
        bool exists;
    }

    mapping (address => Contract) public contractVerifications;
    mapping (address => Attestation[]) public attestationsForContract;
    
    Attestation[] public attestations;

    uint public bountyLimit;
    address owner;
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            throw;
        }
        _;        
    }
    
    function TAP() {
        bountyLimit = 100 ether; // 100 ETH
        owner = msg.sender;
    }

    function addContractVerification(address _addr, string _ipfsHash) payable returns (bool) {
        // Check to see if there already is a verification for this contract
        if(contractVerifications[_addr].exists == true) {
            return false;
        }

        if(msg.value > bountyLimit) {
            throw;  // Return the ETH to the sender since they sent more than allowed right now
        }

        Contract c = contractVerifications[_addr];
        c.contractAddress = _addr;
        c.verificationIPFSHash = _ipfsHash;
        c.bounty = msg.value;
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

        attestationsForContract[_contractAddress].push(a);
        
        return true;
    }

    // Can add a bounty to any contract that's been verified already
    function addBounty(address _contractAddress) payable returns (bool) {
        Contract c = contractVerifications[_contractAddress];

        if(c.exists == false) {
            throw;  // Return money to sender, this contract isn't verified.
        }

        if (c.bounty + msg.value > bountyLimit) {
            throw;
        }

        c.bounty += msg.value;
        return true;
    }


    // This return signature is giving major problems. It works in this order, but
    // bytes4 seems to be screwing something up, as anything that comes after it doesn't
    // get returned correctly. It seems to work if that's the last return val.
    function getAttestation(uint256 id) returns (uint256, address, address, string, bytes4) {
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

    function changeBountyLimit(uint256 newLimit) onlyOwner returns (bool) {
        bountyLimit = newLimit;

        // Any side effects for contracts with bounties already greater than
        // the limit?
        
        return true;
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
