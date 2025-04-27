package com.defi.service;

import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class OracleService {

    public int fetchAssetValuation(String assetName) {
        // NOW: Simulate with random price
        Random random = new Random();
        return random.nextInt(500000) + 10000; // Random between 10k-500k

        // LATER: Replace here with real external API call
        // e.g. OpenAI, Chainlink, or Asset Pricing API
    }
}
