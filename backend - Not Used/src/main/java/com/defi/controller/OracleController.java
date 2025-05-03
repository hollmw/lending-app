package com.defi.controller;

import com.defi.service.OracleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.defi.util.CryptoUtil;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OracleController {

    @GetMapping("/valuation/{tokenId}")
    public Map<String, String> getValuation(@PathVariable String tokenId) {
        // Hardcode valuation for now, or fetch from DB
        String valuationWei = "2000000000000000000000"; // 2000 DAI

        String signature = CryptoUtil.signMessage(tokenId, valuationWei);
        String oracleAddress = CryptoUtil.getOracleAddress();

        Map<String, String> response = new HashMap<>();
        response.put("valuationWei", valuationWei);
        response.put("signature", signature);
        response.put("oracleAddress", oracleAddress); // ✅ include this

        return response;
    }
}