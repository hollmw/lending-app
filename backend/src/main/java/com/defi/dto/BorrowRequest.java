package com.defi.dto;

import java.math.BigInteger;

public class BorrowRequest {
    private BigInteger tokenId;
    private BigInteger amount;

    public BigInteger getTokenId() {
        return tokenId;
    }

    public void setTokenId(BigInteger tokenId) {
        this.tokenId = tokenId;
    }

    public BigInteger getAmount() {
        return amount;
    }

    public void setAmount(BigInteger amount) {
        this.amount = amount;
    }
}
