import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';

import { assetTokenAddress, lendingPoolAddress, mockDaiAddress } from '../addresses';


function AssetCard({ asset }) {
  const { signer, connected } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState('');
  const [approving, setApproving] = useState(false);
  const [borrowing, setBorrowing] = useState(false);

  const approveAsset = async () => {
    if (!connected) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      setApproving(true);
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);

      const tx = await assetTokenContract.approve(lendingPoolAddress, asset.tokenId);
      await tx.wait();

      alert('Approval successful!');
    } catch (error) {
      console.error('Error approving asset', error);
      alert('Error approving asset: ' + (error.reason || error.message));
    } finally {
      setApproving(false);
    }
  };

  const borrowAgainstAsset = async () => {
    if (!borrowAmount) {
      alert('Please enter borrow amount.');
      return;
    }
    if (!connected) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      setBorrowing(true);
      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, signer);

      const tx = await lendingPoolContract.borrow(asset.tokenId, borrowAmount);
      await tx.wait();

      alert('Borrowed successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error borrowing', error);
      alert('Error borrowing: ' + (error.reason || error.message));
    } finally {
      setBorrowing(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-md bg-white">
      <h3 className="text-xl font-bold mb-2">Token ID: {asset.tokenId}</h3>
      <p className="mb-2">{asset.tokenURI}</p>

      <div className="mt-4 flex flex-col space-y-2">
        <button
          onClick={approveAsset}
          disabled={approving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {approving ? 'Approving...' : 'Approve Asset'}
        </button>

        <input
          type="text"
          placeholder="Borrow amount (in wei)"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          className="border p-2"
        />

        <button
          onClick={borrowAgainstAsset}
          disabled={borrowing}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          {borrowing ? 'Borrowing...' : 'Borrow Against Asset'}
        </button>
      </div>
    </div>
  );
}

export default AssetCard;
