// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSigWallet {
    // Events
    event Deposit(address indexed sender, uint amount, uint balance);

    event TransactionSubmitted(
        address indexed owner,
        uint indexed transactionId,
        address indexed to,
        uint value,
        bytes data
    );

    event TransactionConfirmedByOwner(
        address indexed owner,
        uint indexed transactionId
    );

    event TransactionRevokedByOwner(address indexed owner, uint indexed transactionId);

    event TransactionExecuted(address indexed owner, uint indexed transactionId, uint numConfirmations);

    // Storage variables
    address[] owners;
    uint numConfirmationsRequired;
    mapping(address => bool) isOwner;
    mapping(uint => mapping(address => bool)) confirmedByOwner;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    Transaction[] transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier notConfirmed(uint _transactionId) {
        require(
            !confirmedByOwner[_transactionId][msg.sender],
            "Transaction already confirmed by sender"
        );
        _;
    }

    modifier notExecuted(uint _transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        require(!transaction.executed, "Transaction already executed");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        owners = _owners;
        numConfirmationsRequired = _numConfirmationsRequired;
        for (uint i = 0; i < _owners.length; i++) {
            isOwner[_owners[i]] = true;
        }
    }

    receive() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint _value, bytes memory _data) public onlyOwner {   
        uint txId = transactions.length;
       
        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit TransactionSubmitted(msg.sender, txId, _to, _value, _data);
    }

    function confirmTransaction(uint _transactionId)
      public
      onlyOwner
      notConfirmed(_transactionId)
      notExecuted(_transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        transaction.numConfirmations += 1;
        confirmedByOwner[_transactionId][msg.sender] = true;

        emit TransactionConfirmedByOwner(msg.sender, _transactionId);
    }

    function revokeTransaction(uint _transactionId) public onlyOwner notExecuted(_transactionId) {
        require(confirmedByOwner[_transactionId][msg.sender], "Transaction not confirmed by owner");
        Transaction storage transaction = transactions[_transactionId];
        confirmedByOwner[_transactionId][msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit TransactionRevokedByOwner(msg.sender, _transactionId);
    }

    function executeTransaction(uint _transactionId) external onlyOwner notExecuted(_transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.numConfirmations >= numConfirmationsRequired, "Not enough confirmations");
        transaction.executed = true;
        // Execute the transaction
        (bool success, ) = transaction.to.call{value: transaction.value} (transaction.data);
        require(success, "Execution failed");

        emit TransactionExecuted(msg.sender, _transactionId, transaction.numConfirmations);
    }

    // View functions
    function getOwners() public view returns (address[] memory){
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _transactionId) public view returns (
        address, uint, bytes memory, bool, uint
    ) {
        Transaction memory transaction = transactions[_transactionId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}
