import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';

import { assetTokenAddress, lendingPoolAddress, mockDaiAddress } from '../addresses';

function MyAssets() {
  const { provider, walletAddress, connected } = useWallet();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!connected || !walletAddress) {
        console.error('Wallet not connected');
        return;
      }
      try {
        setLoading(true);

        const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, provider);

        const balance = await assetTokenContract.balanceOf(walletAddress);
        console.log('Fetched balance:', balance.toString());

        const assetPromises = [];

        for (let i = 0; i < balance.toNumber(); i++) {
          assetPromises.push((async () => {
            const tokenId = await assetTokenContract.tokenOfOwnerByIndex(walletAddress, i);
            console.log('Fetched tokenId:', tokenId.toString());
            const tokenURI = await assetTokenContract.tokenURI(tokenId);
            return {
              tokenId: tokenId.toString(),
              tokenURI: tokenURI,
            };
          })());
        }

        const assetList = await Promise.all(assetPromises);
        setAssets(assetList);

      } catch (error) {
        console.error('Error fetching assets:', error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      fetchAssets();
    }
  }, [connected, walletAddress]); // ✅ Depend on connected + walletAddress

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Tokenized Assets</h2>

      {loading ? (
        <p>Loading assets...</p>
      ) : assets.length === 0 ? (
        <p>No tokenized assets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div key={asset.tokenId} className="border p-4 rounded shadow bg-white">
              <p><strong>Token ID:</strong> {asset.tokenId}</p>
              <p><strong>Token URI:</strong> {asset.tokenURI}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAssets;
