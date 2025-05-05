// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title LendingPool
 * @dev Enables borrowing ERC-20 tokens using ERC-721 assets as collateral,
 *      with off-chain signed valuations provided by a trusted oracle.
 */
contract LendingPool is ReentrancyGuard {
    /// @dev NFT contract used as collateral (must implement IERC721)
    IERC721 public immutable assetToken;

    /// @dev ERC-20 stablecoin used for loans and repayments
    IERC20 public immutable stablecoin;

    /// @dev Address of oracle signer used to verify compact signatures
    address public oracleSigner;

    /// @dev Address used in raw signature verification (r,s,v)
    address public trustedOracle;

    /// @dev Interest rate in basis points (e.g. 500 = 5%)
    uint256 public interestRate = 500;

    /// @dev Hard cap for borrow amount (e.g. 10,000 DAI)
    uint256 public constant MAX_LOAN_AMOUNT = 10000 * 10 ** 18;

    /// @dev Loan information structure
    struct Loan {
        uint256 loanId;
        uint256 tokenId;
        uint256 amount;
        uint256 startTime;
        uint256 interestDue;
        bool isActive;
    }

    /// @dev Mapping from loan ID to Loan struct
    mapping(uint256 => Loan) public loans;

    /// @dev Mapping from tokenId to loanId to track collateralized NFTs
    mapping(uint256 => uint256) public tokenToLoanId;

    /// @dev Mapping from user address to array of their loan IDs
    mapping(address => uint256[]) public userLoans;

    /// @dev Internal counter for unique loan IDs
    uint256 public loanIdCounter = 1;

    /// @dev Tracks already-used messages to prevent replay attacks (borrowWithSignature)
    mapping(uint256 => bool) public usedMessages;

    // -------------------------- Events --------------------------

    event ValuationUsed(uint256 tokenId, uint256 valuation, uint256 maxBorrow);
    event LoanCreated(uint256 loanId, uint256 tokenId, uint256 amount);
    event LoanRepaid(uint256 loanId, uint256 amount);
    event LoanLiquidated(uint256 loanId);

    /// @dev Debug event for tracing borrow failures
    event BorrowDebug(
        address caller,
        uint256 tokenId,
        address approved,
        bool isApprovedForAll,
        address owner,
        uint256 existingLoanId
    );

    // -------------------------- Constructor --------------------------

    /**
     * @dev Initializes the lending pool with NFT and ERC-20 addresses
     * @param _assetToken ERC-721 token contract
     * @param _stablecoin ERC-20 stablecoin contract
     */
    constructor(address _assetToken, address _stablecoin) {
        assetToken = IERC721(_assetToken);
        stablecoin = IERC20(_stablecoin);
    }

    // -------------------------- Admin Functions --------------------------

    /**
     * @dev Sets the off-chain oracle signer address (used in verifyValuationSignature)
     * @param _signer Address of the oracle signer
     */
    function setOracleSigner(address _signer) external {
        oracleSigner = _signer;
    }

    /**
     * @dev Sets the trusted oracle for borrowWithSignature (raw r/s/v)
     * @param _oracle Address of the trusted oracle
     */
    function setOracle(address _oracle) external {
        trustedOracle = _oracle;
    }

    /**
     * @dev Updates the interest rate in basis points
     * @param newRate New interest rate (e.g. 500 = 5%)
     */
    function updateInterestRate(uint256 newRate) external {
        interestRate = newRate;
    }

    // -------------------------- Borrow Functions --------------------------

    /**
     * @dev Borrow using a compact off-chain signature
     * @param tokenId ID of the NFT being used as collateral
     * @param amount Amount of stablecoin to borrow
     * @param valuation Valuation of the NFT as signed by the oracle
     * @param signature Signature from oracle
     */
    function borrow(
        uint256 tokenId,
        uint256 amount,
        uint256 valuation,
        bytes memory signature
    ) external nonReentrant {
        require(
            verifyValuationSignature(tokenId, valuation, signature),
            "Invalid oracle signature"
        );

        address approved = assetToken.getApproved(tokenId);
        bool isApprovedAll = assetToken.isApprovedForAll(msg.sender, address(this));
        address owner = assetToken.ownerOf(tokenId);
        uint256 existingLoanId = tokenToLoanId[tokenId];

        emit BorrowDebug(msg.sender, tokenId, approved, isApprovedAll, owner, existingLoanId);

        require(approved == address(this) || isApprovedAll, "LendingPool: Not approved to transfer NFT");
        require(owner == msg.sender, "LendingPool: Caller is not NFT owner");
        require(tokenToLoanId[tokenId] == 0, "NFT already COllteralised");
        require(existingLoanId == 0, "LendingPool: NFT already collateralized");
        require(amount > 0 && amount <= MAX_LOAN_AMOUNT, "LendingPool: Invalid borrow amount");
        require(stablecoin.balanceOf(address(this)) >= amount, "LendingPool: Insufficient pool liquidity");

        loanIdCounter++;
        uint256 interest = (amount * interestRate) / 10000;

        loans[loanIdCounter] = Loan({
            loanId: loanIdCounter,
            tokenId: tokenId,
            amount: amount,
            startTime: block.timestamp,
            interestDue: interest,
            isActive: true
        });

        tokenToLoanId[tokenId] = loanIdCounter;
        userLoans[msg.sender].push(loanIdCounter);

        assetToken.transferFrom(msg.sender, address(this), tokenId);
        require(stablecoin.transfer(msg.sender, amount), "LendingPool: Stablecoin transfer failed");

        emit LoanCreated(loanIdCounter, tokenId, amount);
    }

    /**
     * @dev Borrow using r/s/v signature format
     * @param tokenId NFT being collateralized
     * @param amount Amount of stablecoin to borrow
     * @param valuation Off-chain NFT valuation
     * @param deadline Signature expiration timestamp
     * @param v Signature component
     * @param r Signature component
     * @param s Signature component
     */
    function borrowWithSignature(
        uint256 tokenId,
        uint256 amount,
        uint256 valuation,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(block.timestamp <= deadline, "Signature expired");

        bytes32 messageHash = keccak256(abi.encodePacked(tokenId, valuation, deadline));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        require(signer == trustedOracle, "Invalid oracle signature");

        require(!usedMessages[uint256(ethSignedMessageHash)], "Message already used");
        usedMessages[uint256(ethSignedMessageHash)] = true;

        uint256 maxBorrow = (valuation * 70) / 100;
        emit ValuationUsed(tokenId, valuation, maxBorrow);

        require(amount <= maxBorrow, "Exceeds max borrowable");

        // Additional loan issuance logic would go here
    }

    // -------------------------- Repay & Liquidate --------------------------

    /**
     * @dev Repay a loan and reclaim NFT
     * @param loanId ID of the loan to repay
     */
    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");

        uint256 totalDue = loan.amount + loan.interestDue;
        require(stablecoin.transferFrom(msg.sender, address(this), totalDue), "Repay transfer failed");

        assetToken.transferFrom(address(this), msg.sender, loan.tokenId);
        loan.isActive = false;
        tokenToLoanId[loan.tokenId] = 0;

        emit LoanRepaid(loanId, totalDue);
    }

    /**
     * @dev Liquidate a loan and seize NFT (no expiry check here)
     * @param loanId ID of the loan to liquidate
     */
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");

        assetToken.transferFrom(address(this), msg.sender, loan.tokenId);
        loan.isActive = false;
        tokenToLoanId[loan.tokenId] = 0;

        emit LoanLiquidated(loanId);
    }

    // -------------------------- View Functions --------------------------

    /**
     * @dev Returns array of loan IDs taken by a specific user
     * @param user User address
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @dev Returns the currently set oracle signer
     */
    function getOracleSigner() public view returns (address) {
        return oracleSigner;
    }

    /**
     * @dev Validates a compact off-chain valuation signature
     * @param tokenId NFT being valued
     * @param valuation Signed valuation amount
     * @param signature Oracle signature
     * @return True if signature is valid
     */
    function verifyValuationSignature(
        uint256 tokenId,
        uint256 valuation,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(tokenId, valuation));
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);
        return ECDSA.recover(ethSignedMessageHash, signature) == oracleSigner;
    }
}
