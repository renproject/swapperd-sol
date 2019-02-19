pragma solidity ^0.5.0;

import "./interfaces/ISwapContract.sol";
import "./BaseSwapContract.sol";

/// @notice EthSwapContract implements the RenEx atomic swapping interface
/// for Ether values. Does not support ERC20 tokens.
contract EthSwapContract is ISwapContract, BaseSwapContract {

    constructor(string memory _VERSION) BaseSwapContract(_VERSION) public {
    }

    /// @notice Initiates the atomic swap with fees.
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
        require(_value == msg.value && _value >= _brokerFee);
        BaseSwapContract.initiateWithFees(
            _swapID,
            _spender,
            _broker,
            _brokerFee,
            _secretLock,
            _timelock,
            _value
        );
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
        require(_value == msg.value);
        BaseSwapContract.initiateWithFees(
            _swapID,
            _spender,
            address(0x0),
            0,
            _secretLock,
            _timelock,
            _value
        );
    }

    /// @notice Redeems an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _receiver The receiver's address.
    /// @param _secretKey The secret of the atomic swap.
    function redeem(bytes32 _swapID, address payable _receiver, bytes32 _secretKey) public {
        BaseSwapContract.redeem(
            _swapID,
            _receiver,
            _secretKey
        );

        // Transfer the ETH funds from this contract to the receiver.
        _receiver.transfer(BaseSwapContract.swaps[_swapID].value);
    }

    /// @notice Refunds an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    function refund(bytes32 _swapID) public {
        BaseSwapContract.refund(_swapID);

        // Transfer the ETH value from this contract back to the ETH trader.
        BaseSwapContract.swaps[_swapID].funder.transfer(
            BaseSwapContract.swaps[_swapID].value + BaseSwapContract.swaps[_swapID].brokerFee
        );
    }

    /// @notice Allows broker fee withdrawals.
    ///
    /// @param _amount The withdrawal amount.
    function withdrawBrokerFees(uint256 _amount) public {
        BaseSwapContract.withdrawBrokerFees(_amount);
        msg.sender.transfer(_amount);
    }
}