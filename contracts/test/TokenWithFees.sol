pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/ownership/Secondary.sol";

contract TokenWithFees is ERC20, ERC20Detailed("Token With Fees", "FEE", 18),
    ERC20Mintable, ERC20Burnable, ERC20Pausable, Secondary {

    address public feeRecipient;
    uint256 public constant feeBps = 3;

    constructor() public {
        feeRecipient = msg.sender;
        _mint(msg.sender, 100 * 10 ** 18);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        uint256 fee = (value * feeBps) / 1000;
        super.transfer(to, value);
        super._burn(to, fee);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        uint256 fee = (value * feeBps) / 1000;
        super.transferFrom(from, to, value);
        super._burn(to, fee);
        return true;
    }
}
