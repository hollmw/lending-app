package com.defi.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OracleService {

    public Map<String, Object> getAssetValuation(String assetName) {
        Map<String, Object> result = new HashMap<>();

        // 🧠 Here you can either:
        // - Replace with real AI API call later (e.g. OpenAI or Chainlink)
        // - For now simulate a price

        Random random = new Random();
        int fakePrice = 10000 + random.nextInt(90000); // Random price between 10k and 100k USD

        result.put("asset", assetName);
        result.put("price", fakePrice);

        return result;
    }
}
