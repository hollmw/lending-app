package com.defi.controller;

import com.defi.dto.BorrowRequest;
import com.defi.dto.RepayRequest;
import com.defi.dto.TokenizeRequest;
import com.defi.service.web3service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.*;

@RestController
@RequestMapping("/api")
public class LendingController {

    @Autowired
    private web3service web3Service;

    @PostMapping("/tokenize")
    public String tokenizeAsset(@RequestBody TokenizeRequest request) throws Exception {
        return web3Service.mintNFT(request.getTo(), request.getTokenURI());
    }

    @PostMapping("/borrow")
    public String borrow(@RequestBody BorrowRequest request) throws Exception {
        return web3Service.borrow(request.getTokenId(), request.getAmount());
    }

    @PostMapping("/repay")
    public String repay(@RequestBody RepayRequest request) throws Exception {
        return web3Service.repay(request.getLoanId());
    }


    @GetMapping("/loan-status/{loanId}")
    public String getLoanStatus(@PathVariable int loanId) throws Exception {
        return web3Service.getLoanStatus(BigInteger.valueOf(loanId));
    }

    @GetMapping("/my-assets")
    public List<Map<String, Object>> getMyAssets(@RequestParam String wallet) throws Exception {
        List<Map<String, Object>> ownedAssets = new ArrayList<>();
        for (int tokenId = 1; tokenId <= 20; tokenId++) {
            try {
                String owner = web3Service.getAssetToken().ownerOf(BigInteger.valueOf(tokenId)).send();
                if (owner.equalsIgnoreCase(wallet)) {
                    Map<String, Object> asset = new HashMap<>();
                    asset.put("tokenId", tokenId);
                    asset.put("tokenURI", web3Service.getAssetToken().tokenURI(BigInteger.valueOf(tokenId)).send());
                    ownedAssets.add(asset);
                }
            } catch (Exception e) {
                // Ignore non-existing tokens
            }
        }
        return ownedAssets;
    }

    @GetMapping("/my-loans")
    public List<Map<String, Object>> getMyLoans(@RequestParam String wallet) throws Exception {
        List<Map<String, Object>> myLoans = new ArrayList<>();
        for (int loanId = 1; loanId <= 20; loanId++) {
            try {
                var loan = web3Service.getLendingPool().loans(BigInteger.valueOf(loanId)).send();
                BigInteger tokenId = loan.component2(); // tokenId
                boolean isActive = loan.component6(); // isActive
                if (isActive) {
                    String owner = web3Service.getAssetToken().ownerOf(tokenId).send();
                    if (owner.equalsIgnoreCase(wallet)) {
                        Map<String, Object> loanInfo = new HashMap<>();
                        loanInfo.put("loanId", loanId);
                        loanInfo.put("amount", loan.component3());
                        loanInfo.put("interestDue", loan.component5());
                        loanInfo.put("status", "ACTIVE");
                        myLoans.add(loanInfo);
                    }
                }
            } catch (Exception e) {
                // Ignore loans that don't exist
            }
        }
        return myLoans;
    }
}
