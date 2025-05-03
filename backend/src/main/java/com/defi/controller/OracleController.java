package com.defi.controller;

import org.springframework.web.bind.annotation.*;
import com.defi.util.CryptoUtil;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OracleController {

    @GetMapping("/valuation/{tokenId}")
    public Map<String, String> getValuation(@PathVariable String tokenId) {
        String valuationWei = "2000000000000000000000"; // 2000 DAI

        String signature = CryptoUtil.signMessage(tokenId, valuationWei);
        String oracleAddress = CryptoUtil.getOracleAddress();

        Map<String, String> response = new HashMap<>();
        response.put("valuationWei", valuationWei);
        response.put("signature", signature);
        response.put("oracleAddress", oracleAddress);

        return response;
    }
}