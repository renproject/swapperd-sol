pragma solidity ^0.5.1;

import "./ISwapContract.sol";
import "./BaseSwapContract.sol";
import "./CompatibleERC20.sol";

/// @notice WBTCSwapContract implements the ERC20SwapContract interface.
contract WBTCSwapContract is ISwapContract, BaseSwapContract {
    using CompatibleERC20Functions for CompatibleERC20;

    address public TOKEN_ADDRESS; // Address of the ERC20 contract. Passed in as a constructor parameter

    /// @notice The contract constructor.
    ///
    /// @param _VERSION A string defining the contract version.
    constructor(string memory _VERSION, address _TOKEN_ADDRESS) BaseSwapContract(_VERSION) public {
        TOKEN_ADDRESS = _TOKEN_ADDRESS;
    }

    /// @notice Initiates the atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _spender The address of the withdrawing trader.
    /// @param _secretLock The hash of the secret (Hash Lock).
    /// @param _timelock The unix timestamp when the swap expires.
    /// @param _value The value of the atomic swap.
    function initiate(
        bytes32 _swapID,
        address _spender,
        bytes32 _secretLock,
        uint256 _timelock,
        uint256 _value
    ) public payable {
        // To abide by the interface, the function is payable but throws if
        // msg.value is non-zero
        require(msg.value == 0, "non-zero eth value");

        // Transfer the token to the contract
        // TODO: Initiator will first need to call
        // ERC20(TOKEN_ADDRESS).approve(address(this), _value)
        // before this contract can make transfers on the initiator's behalf.
        uint256 value = CompatibleERC20(TOKEN_ADDRESS).safeTransferFromWithFees(msg.sender, address(this), _value);
        
        BaseSwapContract.initiateWithFees(
            _swapID,
            _spender,
            address(0x0),
            0,
            _secretLock,
            _timelock,
            value
        );
    }

    /// @notice Initiates the atomic swap with broker fees.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _spender The address of the withdrawing trader.
    /// @param _broker The address of the broker.
    /// @param _brokerFee The fee to be paid to the broker on success.
    /// @param _secretLock The hash of the secret (Hash Lock).
    /// @param _timelock The unix timestamp when the swap expires.
    /// @param _value The value of the atomic swap.
    function initiateWithFees(
        bytes32 _swapID,
        address _spender,
        address _broker,
        uint256 _brokerFee,
        bytes32 _secretLock,
        uint256 _timelock,
        uint256 _value
    ) public payable {
        // To abide by the interface, the function is payable but throws if
        // msg.value is non-zero
        require(msg.value == 0, "non-zero eth value");

        // Transfer the token to the contract
        // TODO: Initiator will first need to call
        // ERC20(TOKEN_ADDRESS).approve(address(this), _value)
        // before this contract can make transfers on the initiator's behalf.
        uint256 value = CompatibleERC20(TOKEN_ADDRESS).safeTransferFromWithFees(msg.sender, address(this), _value);
        require(_broker != address(0x0) && _brokerFee != 0, "broker and broker fee must be initiated");

        BaseSwapContract.initiateWithFees(
            _swapID,
            _spender,
            _broker,
            _brokerFee,
            _secretLock,
            _timelock,
            value
        );
    }

    /// @notice Redeems an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _secretKey The secret of the atomic swap.
    function redeem(bytes32 _swapID, address payable _receiver, bytes32 _secretKey) public {
        BaseSwapContract.redeem(
            _swapID,
            _receiver,
            _secretKey
        );

        // Transfer the ERC20 funds from this contract to the withdrawing trader.
        CompatibleERC20(TOKEN_ADDRESS).safeTransfer(_receiver, swaps[_swapID].value);
    }

    /// @notice Refunds an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    function refund(bytes32 _swapID) public {
        BaseSwapContract.refund(_swapID);

        // Transfer the ERC20 value from this contract back to the funding trader.
        CompatibleERC20(TOKEN_ADDRESS).safeTransfer(swaps[_swapID].funder, swaps[_swapID].value + swaps[_swapID].brokerFee);
    }

    /// @notice Allows broker fee withdrawals.
    ///
    /// @param _amount The withdrawal amount.
    function withdrawBrokerFees(uint256 _amount) public {
        BaseSwapContract.withdrawBrokerFees(_amount);
        
        CompatibleERC20(TOKEN_ADDRESS).safeTransfer(msg.sender, _amount);
    }
}
