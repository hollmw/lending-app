package com.lendingapp.dto;

import java.math.BigInteger;

public class RepayRequest {
    private BigInteger loanId;

    public BigInteger getLoanId() {
        return loanId;
    }

    public void setLoanId(BigInteger loanId) {
        this.loanId = loanId;
    }
}
