package com.defi.controller;

import com.defi.service.OracleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class OracleController {

    @Autowired
    private OracleService oracleService;

    @GetMapping("/oracle-lookup")
    public Map<String, Object> lookupAsset(@RequestParam String assetName) {
        return oracleService.getAssetValuation(assetName);
    }
}
