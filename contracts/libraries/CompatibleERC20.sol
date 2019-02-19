pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

/// @notice Implements safeTransfer, safeTransferFrom and
/// safeApprove for CompatibleERC20.
///
/// See https://github.com/ethereum/solidity/issues/4116
///
/// This library allows interacting with ERC20 tokens that implement any of
/// these interfaces:
///
/// (1) transfer returns true on success, false on failure
/// (2) transfer returns true on success, reverts on failure
/// (3) transfer returns nothing on success, reverts on failure
///
/// Additionally, safeTransferFromWithFees will return the final token
/// value received after accounting for token fees.
library CompatibleERC20Functions {
    using SafeMath for uint256;

    /// @notice Calls transfer on the token and reverts if the call fails.
    function safeTransfer(CompatibleERC20 self, address to, uint256 amount) internal {
        self.transfer(to, amount);
        require(previousReturnValue(), "transfer failed");
    }

    /// @notice Calls transferFrom on the token and reverts if the call fails.
    function safeTransferFrom(CompatibleERC20 self, address from, address to, uint256 amount) internal {
        self.transferFrom(from, to, amount);
        require(previousReturnValue(), "transferFrom failed");
    }

    /// @notice Calls approve on the token and reverts if the call fails.
    function safeApprove(CompatibleERC20 self, address spender, uint256 amount) internal {
        self.approve(spender, amount);
        require(previousReturnValue(), "approve failed");
    }

    /// @notice Calls transferFrom on the token, reverts if the call fails and
    /// returns the value transferred after fees.
    function safeTransferFromWithFees(CompatibleERC20 self, address from, address to, uint256 amount) internal returns (uint256) {
        uint256 balancesBefore = self.balanceOf(to);
        self.transferFrom(from, to, amount);
        require(previousReturnValue(), "transferFrom failed");
        uint256 balancesAfter = self.balanceOf(to);
        return Math.min(amount, balancesAfter.sub(balancesBefore));
    }

    /// @notice Checks the return value of the previous function. Returns true
    /// if the previous function returned 32 non-zero bytes or returned zero
    /// bytes.
    function previousReturnValue() private pure returns (bool)
    {
        uint256 returnData = 0;

        assembly { /* solium-disable-line security/no-inline-assembly */
            // Switch on the number of bytes returned by the previous call
            switch returndatasize

            // 0 bytes: ERC20 of type (3), did not throw
            case 0 {
                returnData := 1
            }

            // 32 bytes: ERC20 of types (1) or (2)
            case 32 {
                // Copy the return data into scratch space
                returndatacopy(0, 0, 32)

                // Load  the return data into returnData
                returnData := mload(0)
            }

            // Other return size: return false
            default { }
        }

        return returnData != 0;
    }
}

/// @notice ERC20 interface which doesn't specify the return type for transfer,
/// transferFrom and approve.
interface CompatibleERC20 {
    // Modified to not return boolean
    function transfer(address to, uint256 value) external;
    function transferFrom(address from, address to, uint256 value) external;
    function approve(address spender, uint256 value) external;

    // Not modifier
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
