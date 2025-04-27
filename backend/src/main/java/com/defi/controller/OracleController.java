package com.defi.controller;

import com.defi.service.OracleService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class OracleController {

    private final OracleService oracleService;

    public OracleController(OracleService oracleService) {
        this.oracleService = oracleService;
    }

    @GetMapping("/oracle-lookup")
    public Map<String, Integer> oracleLookup(@RequestParam String assetName) {
        int price = oracleService.fetchAssetValuation(assetName);
        return Map.of("price", price);
    }
}
