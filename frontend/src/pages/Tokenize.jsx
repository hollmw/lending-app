import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import axios from '../services/api';
import AssetTokenABI from '../abis/AssetToken.json';
import Nav from '../components/Nav';
import { assetTokenAddress } from '../addresses';

function Tokenize() {
  const { signer, connected } = useWallet();
  const [assetName, setAssetName] = useState('');
  const [valuation, setValuation] = useState(null);
  const [minting, setMinting] = useState(false);

  const lookupAsset = async () => {
    try {
      const res = await axios.post('/api/valuation', { description: assetName });
  
      setValuation({
        dai: parseFloat(ethers.utils.formatEther(res.data.valuationWei)),
        valuationWei: res.data.valuationWei,
        signature: res.data.signature,
      });
    } catch (error) {
      console.error('Oracle lookup error', error);
      alert('Error fetching asset valuation.');
    }
  };

  const mintAsset = async () => {
    if (!valuation || !connected || !signer) {
      alert('Connect wallet and lookup valuation first.');
      return;
    }

    try {
      setMinting(true);
      const contract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);
      const userAddress = await signer.getAddress();

      const tx = await contract.mint(userAddress, assetName, valuation.valuationWei);
      await tx.wait();

      alert('NFT minted successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Mint error:', err);
      alert('Mint failed: ' + (err.reason || err.message));
    } finally {
      setMinting(false);
    }
  };

  return (
    <>
      <Nav></Nav>
      <div className="flex flex-col items-center space-y-4 p-8 bg-fti-light min-h-screen">
        <h2 className="text-2xl font-bold text-fti-blue">Tokenize Asset</h2>

        <input
          type="text"
          placeholder="Enter asset name/description"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          className="border p-2 rounded w-64"
        />

        <button
          onClick={lookupAsset}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Lookup Valuation
        </button>

        {valuation && (
          <div className="text-center">
            <p>Asset Valuation: <strong>{valuation.dai}</strong> DAI</p>
            <button
              onClick={mintAsset}
              disabled={minting}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {minting ? 'Minting...' : 'Tokenize (Mint) Asset'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Tokenize;
