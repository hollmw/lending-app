import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import axios from '../services/api';
import AssetTokenABI from '../abis/AssetToken.json';
import Nav from '../components/Nav';


const assetTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Update

function Tokenize() {
  const { signer, connected } = useWallet();
  const [assetName, setAssetName] = useState('');
  const [valuation, setValuation] = useState(null);
  const [minting, setMinting] = useState(false);

  const lookupAsset = async () => {
    try {
      const res = await axios.get(`/oracle-lookup?assetName=${assetName}`);
      setValuation(res.data.price);
    } catch (error) {
      console.error('Oracle lookup error', error);
      alert('Error fetching asset valuation.');
    }
  };

  const mintAsset = async () => {
    if (!valuation) {
      alert('Please lookup asset first.');
      return;
    }
    if (!connected) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      setMinting(true);

      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI, signer);

      const userWallet = await signer.getAddress();
      const tokenURI = `Asset: ${assetName}, Valuation: ${valuation} USD`;

      const tx = await assetTokenContract.mint(userWallet, tokenURI);
      await tx.wait();

      alert('NFT minted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error minting asset', error);
      alert('Error minting asset: ' + (error.reason || error.message));
    } finally {
      setMinting(false);
    }
  };

  return (
    <>
    <Nav />
    <div className="flex flex-col items-center space-y-4">
      <input
        type="text"
        placeholder="Enter asset name (e.g., Tesla)"
        value={assetName}
        onChange={(e) => setAssetName(e.target.value)}
        className="border p-2 rounded"
      />

      <button
        onClick={lookupAsset}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Lookup Valuation
      </button>

      {valuation && (
        <div>
          <p>Asset Valuation: ${valuation} USD</p>
          <button
            onClick={mintAsset}
            disabled={minting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-2 disabled:bg-gray-400"
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
