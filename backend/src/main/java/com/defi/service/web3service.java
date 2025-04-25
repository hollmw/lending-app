package com.defi.service;

import com.defi.contracts.AssetToken;
import com.defi.contracts.LendingPool;
import com.defi.contracts.MockDAI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.StaticGasProvider;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import jakarta.annotation.PostConstruct;
import java.math.BigInteger;

@Service
public class web3service {

    @Value("${web3.node-url}")
    private String nodeUrl;

    @Value("${web3.private-key}")
    private String privateKey;

    @Value("${web3.contracts.assetToken}")
    private String assetTokenAddress;

    @Value("${web3.contracts.lendingPool}")
    private String lendingPoolAddress;

    @Value("${web3.contracts.mockDai}")
    private String mockDaiAddress;

    private Web3j web3j;
    private Credentials credentials;

    private AssetToken assetToken;
    private LendingPool lendingPool;
    private MockDAI mockDAI;

    private StaticGasProvider gasProvider;

    @PostConstruct
    public void init() {
        web3j = Web3j.build(new HttpService(nodeUrl));
        credentials = Credentials.create(privateKey);

        gasProvider = new StaticGasProvider(
            DefaultGasProvider.GAS_PRICE,
            DefaultGasProvider.GAS_LIMIT
        );

        assetToken = AssetToken.load(assetTokenAddress, web3j, credentials, gasProvider);
        lendingPool = LendingPool.load(lendingPoolAddress, web3j, credentials, gasProvider);
        mockDAI = MockDAI.load(mockDaiAddress, web3j, credentials, gasProvider);
    }

    public String mintNFT(String to, String tokenURI) throws Exception {
        TransactionReceipt tx = assetToken.mint(to, tokenURI).send();
        return tx.getTransactionHash();
    }

    public String borrow(BigInteger tokenId, BigInteger amount) throws Exception {
        // 1. Check if token is already used for an active loan
        BigInteger loanId = lendingPool.tokenToLoanId(tokenId).send();
        if (!loanId.equals(BigInteger.ZERO)) {
            throw new Exception("Token is already used as collateral in an active loan.");
        }
    
        // 2. Only approve if LendingPool isn't already approved
        String approved = assetToken.getApproved(tokenId).send();
        if (!approved.equalsIgnoreCase(lendingPoolAddress)) {
            assetToken.approve(lendingPoolAddress, tokenId).send();
        }
    
        // 3. Call LendingPool.borrow
        TransactionReceipt tx = lendingPool.borrow(tokenId, amount).send();
        return tx.getTransactionHash();
    }
    

    public String repay(BigInteger loanId) throws Exception {
        var loan = lendingPool.loans(loanId).send();
    
        if (!loan.component6()) { // isActive
            throw new Exception("Loan has already been repaid.");
        }
    
        BigInteger totalDue = loan.component3().add(loan.component5()); // amount + interest
    
        mockDAI.approve(lendingPoolAddress, totalDue).send();
        TransactionReceipt tx = lendingPool.repay(loanId).send();
        return tx.getTransactionHash();
    }
    

    public String getLoanStatus(BigInteger loanId) throws Exception {
        var loan = lendingPool.loans(loanId).send();
    
        // Defensive: if loan is empty (zeroed) — treat as not found
        if (loan.component1().equals(BigInteger.ZERO)) {
            return "NOT_FOUND";
        }
    
        Boolean active = loan.component6(); // isActive
        return active ? "ACTIVE" : "INACTIVE";
    }
}
