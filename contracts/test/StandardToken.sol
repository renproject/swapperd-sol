pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Secondary.sol";

contract StandardToken is ERC20, ERC20Detailed("Standard Token", "STD", 8),
    ERC20Mintable, ERC20Burnable, ERC20Pausable, Secondary {

    constructor() public {
        _mint(msg.sender, 100 * 10 ** 8);
    }

    function burn(uint value) public onlyPrimary {
        super.burn(value);
    }

    function finishMinting() public view onlyPrimary returns (bool) {
        return false;
    }
}
