package com.lendingapp.controller;

import com.lendingapp.service.Web3Service;
import com.lendingapp.dto.BorrowRequest;
import com.lendingapp.dto.TokenizeRequest;
import com.lendingapp.dto.RepayRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;

@RestController
@RequestMapping("/api")
public class LendingController {

    @Autowired
    private Web3Service web3Service;

    @PostMapping("/tokenize")
    public ResponseEntity<String> mintAsset(@RequestBody TokenizeRequest request) {
        try {
            String tx = web3Service.mintNFT(request.getTo(), request.getTokenURI());
            return ResponseEntity.ok("NFT minted: " + tx);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error minting NFT: " + e.getMessage());
        }
    }

    @PostMapping("/borrow")
    public ResponseEntity<String> borrow(@RequestBody BorrowRequest request) {
        try {
            String tx = web3Service.borrow(request.getTokenId(), request.getAmount());
            return ResponseEntity.ok("Borrowed: " + tx);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error borrowing: " + e.getMessage());
        }
    }

    @PostMapping("/repay")
    public ResponseEntity<String> repay(@RequestBody RepayRequest request) {
        try {
            String tx = web3Service.repay(request.getLoanId());
            return ResponseEntity.ok("Loan repaid: " + tx);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error repaying loan: " + e.getMessage());
        }
    }

    @GetMapping("/loan-status/{loanId}")
    public ResponseEntity<String> getLoanStatus(@PathVariable BigInteger loanId) {
        try {
            String status = web3Service.getLoanStatus(loanId);
            return ResponseEntity.ok("Loan status: " + status);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error getting loan status: " + e.getMessage());
        }
    }
}
