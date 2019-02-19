pragma solidity ^0.5.0;

interface SwapInterface {
    // Public variables
    function brokerFees(address _broker) external view returns (uint256);
    function redeemedAt(bytes32 _swapID) external view returns(uint256);

    /// @notice Initiates the atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _spender The address of the withdrawing trader.
    /// @param _secretLock The hash of the secret (Hash Lock).
    /// @param _timelock The unix timestamp when the swap expires.
    /// @param _value The value of the atomic swap.
    function initiate(
        bytes32 _swapID,
        address payable _spender,
        bytes32 _secretLock,
        uint256 _timelock,
        uint256 _value
    ) external payable;

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
        address payable _spender,
        address payable _broker,
        uint256 _brokerFee,
        bytes32 _secretLock,
        uint256 _timelock,
        uint256 _value
    ) external payable;

    /// @notice Redeems an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    /// @param _receiver The receiver's address.
    /// @param _secretKey The secret of the atomic swap.
    function redeem(bytes32 _swapID, address payable _receiver, bytes32 _secretKey) external;

    /// @notice Refunds an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    function refund(bytes32 _swapID) external;

    /// @notice Allows broker fee withdrawals.
    ///
    /// @param _amount The withdrawal amount.
    function withdrawBrokerFees(uint256 _amount) external;

    /// @notice Audits an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    function audit(
        bytes32 _swapID
    ) external view returns (
        uint256 timelock,
        uint256 value,
        address to, uint256 brokerFee,
        address broker,
        address from,
        bytes32 secretLock
    );

    /// @notice Audits the secret of an atomic swap.
    ///
    /// @param _swapID The unique atomic swap id.
    function auditSecret(bytes32 _swapID) external view  returns (bytes32 secretKey);

    /// @notice Checks whether a swap is refundable or not.
    ///
    /// @param _swapID The unique atomic swap id.
    function refundable(bytes32 _swapID) external view returns (bool);

    /// @notice Checks whether a swap is initiatable or not.
    ///
    /// @param _swapID The unique atomic swap id.
    function initiatable(bytes32 _swapID) external view returns (bool);

    /// @notice Checks whether a swap is redeemable or not.
    ///
    /// @param _swapID The unique atomic swap id.
    function redeemable(bytes32 _swapID) external view returns (bool);

    /// @notice Generates a deterministic swap id using initiate swap details.
    ///
    /// @param _secretLock The hash of the secret.
    /// @param _timelock The expiry timestamp.
    function swapID(bytes32 _secretLock, uint256 _timelock) external pure returns (bytes32);
}