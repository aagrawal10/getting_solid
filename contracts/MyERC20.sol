// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC20 {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);

    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool);
}

contract MyERC20 is ERC20 {
    
    mapping (address => uint) balanceOfAddress;
    mapping (address => mapping (address => uint)) approvedAllowance;
    string name;
    string symbol;
    uint maxSupply;
    address owner;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    function totalSupply() override external view returns (uint) {
        return maxSupply;
    } 

    function balanceOf(address _account) override external view returns (uint) {
        return balanceOfAddress[_account];
    }

    function transfer(address _recipient, uint _amount) override external returns (bool) {
        return _transfer(msg.sender, _recipient, _amount);
    }

    function allowance(address _owner, address _spender) override external view returns (uint) {
        return approvedAllowance[_owner][_spender];
    }

    function approve(address _spender, uint _amount) override external returns (bool) {
        require(approvedAllowance[msg.sender][_spender] == 0, "Allowance already set for spender");
        approvedAllowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function removeAllowance(address _spender) external returns (bool) {
        approvedAllowance[msg.sender][_spender] = 0;
        return true;
    }

    function transferFrom(
        address _sender,
        address _recipient,
        uint _amount
     ) override external returns (bool) {
        require(approvedAllowance[_sender][msg.sender] >= _amount, "Amount exceeds allowance");
        approvedAllowance[_sender][msg.sender] -= _amount;
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    function _transfer(address _sender, address _recipient, uint _amount) internal returns (bool) {
        require(balanceOfAddress[_sender] >= _amount, "Amount exceeds balance");
        balanceOfAddress[_sender] -= _amount;
        // TODO: Check if this is vulnerable to overflow.
        balanceOfAddress[_recipient] += _amount;
        emit Transfer(_sender, _recipient, _amount);
        return true;
    }

    function mintTokens(address _account, uint _amount) external {
        require(msg.sender == owner);
        balanceOfAddress[_account] += _amount;
        maxSupply += _amount;
    }
}
