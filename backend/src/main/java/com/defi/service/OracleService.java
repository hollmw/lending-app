package com.defi.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OracleService {

    public Map<String, Object> getAssetValuation(String assetName) {
        Map<String, Object> result = new HashMap<>();


        Random random = new Random();
        int fakePrice = 10000 + random.nextInt(90000);

        result.put("asset", assetName);
        result.put("price", fakePrice);

        return result;
    }
}
