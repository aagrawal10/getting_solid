//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract EtherWallet {
    address owner;

    constructor() {
        owner = msg.sender;
    }

    function withdraw(uint _amount) external {
        assert(owner == msg.sender);
        payable(owner).transfer(_amount);
    }

    function modifyOwner(address _newOwner) external {
        assert(owner == msg.sender);
        owner = _newOwner;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}
}
