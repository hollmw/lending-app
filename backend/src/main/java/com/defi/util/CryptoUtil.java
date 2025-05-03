package com.defi.util;

import java.math.BigInteger;
import java.nio.ByteBuffer;

// CryptoUtil.java
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Sign;
import org.web3j.crypto.Hash;
import org.web3j.utils.Numeric;


public class CryptoUtil {
    private static final String PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    private static final ECKeyPair keyPair = ECKeyPair.create(new BigInteger(PRIVATE_KEY, 16));

    public static String signMessage(String tokenId, String valuationWei) {
        byte[] tokenBytes = Numeric.toBytesPadded(new BigInteger(tokenId), 32);
        byte[] valBytes = Numeric.toBytesPadded(new BigInteger(valuationWei), 32);
    
        byte[] packed = new byte[tokenBytes.length + valBytes.length];
        System.arraycopy(tokenBytes, 0, packed, 0, tokenBytes.length);
        System.arraycopy(valBytes, 0, packed, tokenBytes.length, valBytes.length);
    
        byte[] messageHash = Hash.sha3(packed);
    
        // Ethereum signed message hash
        String prefix = "\u0019Ethereum Signed Message:\n32";
        byte[] prefixBytes = prefix.getBytes();
        ByteBuffer buffer = ByteBuffer.allocate(prefixBytes.length + messageHash.length);
        buffer.put(prefixBytes);
        buffer.put(messageHash);
        byte[] finalMessage = buffer.array();

        byte[] finalHash = Hash.sha3(finalMessage);
    
        Sign.SignatureData signature = Sign.signMessage(finalHash, keyPair, false);
    
        // Encode the r, s, v values into one string
        return Numeric.toHexString(signature.getR())
             + Numeric.toHexString(signature.getS()).substring(2)
             + String.format("%02x", signature.getV()[0]); // ✅ FIX HERE
    }
    

    public static String getOracleAddress() {
        BigInteger publicKey = keyPair.getPublicKey();
        byte[] pubKeyBytes = Numeric.hexStringToByteArray(publicKey.toString(16));
        byte[] hash = Hash.sha3(pubKeyBytes);
        return "0x" + Numeric.toHexString(hash).substring(26); // last 20 bytes
    }
}