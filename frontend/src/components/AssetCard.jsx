import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import { assetTokenAddress, lendingPoolAddress } from '../addresses';

function AssetCard({ asset }) {
  const { signer, connected } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState('');
  const [approving, setApproving] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const approveAsset = async () => {
    if (!connected) return alert('Please connect your wallet first.');
  
    try {
      setApproving(true);
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);
  
      // Check current approval first
      const currentApproval = await assetTokenContract.getApproved(asset.tokenId);
      if (currentApproval.toLowerCase() === lendingPoolAddress.toLowerCase()) {
        setIsApproved(true);
        return alert('Asset already approved');
      }
  
      const tx = await assetTokenContract.approve(lendingPoolAddress, asset.tokenId);
      console.log("Approval tx sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Approval tx mined:", receipt);
      
      // Verify approval was successful
      const newApproval = await assetTokenContract.getApproved(asset.tokenId);
      setIsApproved(newApproval.toLowerCase() === lendingPoolAddress.toLowerCase());
      
      alert(newApproval === lendingPoolAddress 
        ? 'Approval successful!' 
        : 'Approval failed');
        
    } catch (error) {
      console.error('Approval error:', error);
      alert(`Approval failed: ${error.reason || error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const borrowAgainstAsset = async () => {
    if (!borrowAmount) {
      alert('Please enter borrow amount.');
      return;
    }
    if (!isApproved) {
      alert('Please approve the asset first.');
      return;
    }
  
    try {
      setBorrowing(true);
      
      // 1. Verify approval status again
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);
      const approvedAddress = await assetTokenContract.getApproved(asset.tokenId);
      
      console.log("Approval check:", {
        approvedAddress,
        lendingPoolAddress,
        match: approvedAddress.toLowerCase() === lendingPoolAddress.toLowerCase()
      });
  
      if (approvedAddress.toLowerCase() !== lendingPoolAddress.toLowerCase()) {
        alert('Asset not approved for LendingPool. Please approve first.');
        setIsApproved(false);
        return;
      }
  
      // 2. Create contract instance with more details
      const lendingPoolContract = new ethers.Contract(
        lendingPoolAddress,
        LendingPoolABI.abi,
        signer
      );
  
      // 3. Convert amount properly
      const amountInWei = ethers.utils.parseUnits(borrowAmount, 18);
  
      // 4. Try with manual gas limit
      const tx = await lendingPoolContract.borrow(asset.tokenId, amountInWei, {
        gasLimit: 500000 // Increased gas limit
      });
  
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt);
  
      alert('Borrowed successfully!');
      window.location.reload();
      
    } catch (error) {
      console.error('Detailed borrowing error:', {
        error,
        message: error.message,
        reason: error.reason,
        data: error.data,
        stack: error.stack
      });
      
      alert(`Borrowing failed: ${error.reason || error.message}`);
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
          disabled={approving || isApproved}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {approving ? 'Approving...' : (isApproved ? 'Asset Approved ✅' : 'Approve Asset')}
        </button>

        <input
          type="text"
          placeholder="Borrow amount (e.g. 10)"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          className="border p-2"
        />

        <button
          onClick={borrowAgainstAsset}
          disabled={!isApproved || borrowing}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          {borrowing ? 'Borrowing...' : 'Borrow Against Asset'}
        </button>
      </div>
    </div>
  );
}

export default AssetCard;
