// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LendingPool is ReentrancyGuard {
    IERC721 public assetToken;
    IERC20 public stablecoin;
    
    // Placeholder values - adjust later
    uint256 public interestRate = 500; // 5% in basis points (500/10000)
    uint256 public loanTerm = 30 days;
    uint256 public liquidationThreshold = 7000; // 70% LTV
    
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
    uint256 public loanIdCounter;
    
    event LoanCreated(uint256 loanId, uint256 tokenId, uint256 amount);
    event LoanRepaid(uint256 loanId, uint256 amount);
    event LoanLiquidated(uint256 loanId);
    
    constructor(address _assetToken, address _stablecoin) {
        assetToken = IERC721(_assetToken);
        stablecoin = IERC20(_stablecoin);
    }
    
    function borrow(uint256 tokenId, uint256 amount) external nonReentrant {
        require(assetToken.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenToLoanId[tokenId] == 0, "Token already collateralized");
        
        // Simple collateral valuation - replace with oracle later
        uint256 maxLoanAmount = 1000 * 10 ** 18; // Placeholder: 1000 DAI max per NFT
        require(amount <= maxLoanAmount, "Loan amount exceeds collateral value");
        
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
        
        // Transfer collateral NFT to contract
        assetToken.transferFrom(msg.sender, address(this), tokenId);
        
        // Transfer stablecoins to borrower
        require(stablecoin.transfer(msg.sender, amount), "Transfer failed");
        
        emit LoanCreated(loanIdCounter, tokenId, amount);
    }
    
    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        
        uint256 totalDue = loan.amount + loan.interestDue;
        require(stablecoin.transferFrom(msg.sender, address(this), totalDue), "Transfer failed");
        
        // Return collateral to borrower
        assetToken.transferFrom(address(this), msg.sender, loan.tokenId);
        
        loan.isActive = false;
        tokenToLoanId[loan.tokenId] = 0;
        
        emit LoanRepaid(loanId, totalDue);
    }
    
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(block.timestamp > loan.startTime + loanTerm, "Loan not expired");
        
        // Transfer NFT to liquidator
        assetToken.transferFrom(address(this), msg.sender, loan.tokenId);
        
        loan.isActive = false;
        tokenToLoanId[loan.tokenId] = 0;
        
        emit LoanLiquidated(loanId);
    }
    
    // Placeholder function to update interest rate (add access control later)
    function updateInterestRate(uint256 newRate) external {
        interestRate = newRate;
    }
}