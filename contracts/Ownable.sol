pragma solidity ^0.5.12;

contract Ownable {
  address owner;
  
  modifier onlyOwner(){
    require(msg.sender == owner, "Sender is not the owner");
    _; //Continue execution
  }

  constructor() public {
    owner = msg.sender;
  }
}