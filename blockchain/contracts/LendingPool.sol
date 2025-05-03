// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


contract LendingPool is ReentrancyGuard {
    IERC721 public immutable assetToken;
    IERC20 public immutable stablecoin;
    address public oracleSigner;


    uint256 public interestRate = 500; // 5% interest (500 basis points)
    uint256 public constant MAX_LOAN_AMOUNT = 10000 * 10 ** 18;
    
    struct Loan {
        uint256 loanId;
        uint256 tokenId;
        uint256 amount;
        uint256 startTime;
        uint256 interestDue;
        bool isActive;
    }

    mapping(uint256 => Loan) public loans;
    mapping(uint256 => uint256) public tokenToLoanId;
    mapping(address => uint256[]) public userLoans;

    uint256 public loanIdCounter = 1;

    event ValuationUsed(uint256 tokenId, uint256 valuation, uint256 maxBorrow);

    event LoanCreated(uint256 loanId, uint256 tokenId, uint256 amount);
    event LoanRepaid(uint256 loanId, uint256 amount);
    event LoanLiquidated(uint256 loanId);
    event BorrowDebug(
        address caller,
        uint256 tokenId,
        address approved,
        bool isApprovedForAll,
        address owner,
        uint256 existingLoanId
    );

    constructor(address _assetToken, address _stablecoin) {
        assetToken = IERC721(_assetToken);
        stablecoin = IERC20(_stablecoin);
    }
    function setOracleSigner(address _signer) external {
        oracleSigner = _signer;
    }
    address public trustedOracle;
    mapping(uint256 => bool) public usedMessages;

    function setOracle(address _oracle) external {
        trustedOracle = _oracle;
    }

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
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        require(signer == trustedOracle, "Invalid oracle signature");
        require(!usedMessages[uint256(ethSignedMessageHash)], "Message already used");
        usedMessages[uint256(ethSignedMessageHash)] = true;

        uint256 maxBorrow = (valuation * 70) / 100; // 70% LTV
        emit ValuationUsed(tokenId, valuation, maxBorrow);

        require(amount <= maxBorrow, "Exceeds max borrowable");

    }


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



        
        // Debug information
        address approved = assetToken.getApproved(tokenId);
        bool isApprovedAll = assetToken.isApprovedForAll(msg.sender, address(this));
        address owner = assetToken.ownerOf(tokenId);
        uint256 existingLoanId = tokenToLoanId[tokenId];
        
        emit BorrowDebug(
            msg.sender,
            tokenId,
            approved,
            isApprovedAll,
            owner,
            existingLoanId
        );

        // Validation checks with clear error messages
        require(
            approved == address(this) || isApprovedAll,
            "LendingPool: Not approved to transfer NFT"
        );
        require(
            owner == msg.sender,
            "LendingPool: Caller is not NFT owner"
        );
        require(tokenToLoanId[tokenId] == 0, "NFT already COllteralised");
        require(
            existingLoanId == 0,
            "LendingPool: NFT already collateralized"
        );
        require(
            amount > 0 && amount <= MAX_LOAN_AMOUNT,
            "LendingPool: Invalid borrow amount"
        );
        require(
            stablecoin.balanceOf(address(this)) >= amount,
            "LendingPool: Insufficient pool liquidity"
        );

        // Create new loan
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

        // Transfer NFT to pool
        assetToken.transferFrom(msg.sender, address(this), tokenId);
        
        // Transfer stablecoin to borrower
        require(
            stablecoin.transfer(msg.sender, amount),
            "LendingPool: Stablecoin transfer failed"
        );

        emit LoanCreated(loanIdCounter, tokenId, amount);
    }

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

    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        //require(block.timestamp > loan.startTime + loanTerm, "Loan not expired");

        assetToken.transferFrom(address(this), msg.sender, loan.tokenId);

        loan.isActive = false;
        tokenToLoanId[loan.tokenId] = 0;

        emit LoanLiquidated(loanId);
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    function updateInterestRate(uint256 newRate) external {
        interestRate = newRate;
    }


    // Oracle stuff
    function verifyValuationSignature(
        uint256 tokenId,
        uint256 valuation,
        bytes memory signature
    ) 
    public view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(tokenId, valuation));
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);
        return ECDSA.recover(ethSignedMessageHash, signature) == oracleSigner;
    }

    function getOracleSigner() public view returns (address) {
        return oracleSigner;
    }


}
