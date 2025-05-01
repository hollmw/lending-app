import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import { assetTokenAddress, lendingPoolAddress } from '../addresses';

function AssetCard({ asset }) {
  const { signer, account, connected, chainId, connect } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState(null);

  // Check approval status
  useEffect(() => {
    if (!connected || !account || !signer) return;

    const checkApproval = async () => {
      try {
        const assetTokenContract = new ethers.Contract(
          assetTokenAddress,
          AssetTokenABI.abi,
          signer
        );

        const [approvedAddress, isApprovedForAll] = await Promise.all([
          assetTokenContract.getApproved(asset.tokenId),
          assetTokenContract.isApprovedForAll(account, lendingPoolAddress)
        ]);

        setIsApproved(approvedAddress === lendingPoolAddress || isApprovedForAll);
      } catch (err) {
        console.error('Approval check error:', err);
        setIsApproved(false);
      }
    };

    checkApproval();
  }, [connected, account, asset.tokenId, signer]);

  const approveAsset = async () => {
    if (!connected) {
      await connect();
      return;
    }

    try {
      setIsApproving(true);
      setError(null);

      const assetTokenContract = new ethers.Contract(
        assetTokenAddress,
        AssetTokenABI.abi,
        signer
      );

      const tx = await assetTokenContract.approve(lendingPoolAddress, asset.tokenId, {
        gasLimit: 200000 // Sufficient for approval
      });

      await tx.wait();
      setIsApproved(true);
    } catch (err) {
      console.error('Approval failed:', {
        error: err,
        message: err.message,
        reason: err.reason,
        data: err.data
      });
      setError(`Approval failed: ${err.reason || err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const borrowAgainstAsset = async () => {
    if (!connected) {
      await connect();
      return;
    }
  
    if (!borrowAmount || isNaN(borrowAmount)) {
      setError('Please enter a valid amount');
      return;
    }
  
    try {
      setIsBorrowing(true);
      setError(null);
  
      const assetTokenContract = new ethers.Contract(
        assetTokenAddress,
        AssetTokenABI.abi,
        signer
      );
  
      const lendingPoolContract = new ethers.Contract(
        lendingPoolAddress,
        LendingPoolABI.abi,
        signer
      );
  
      const tokenId = asset.tokenId;
  
      // 1. Check ownership
      const owner = await assetTokenContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You no longer own this NFT');
      }
  
      // 2. Check existing loan
      const existingLoanId = await lendingPoolContract.tokenToLoanId(tokenId);
      if (existingLoanId !== 0) {
        throw new Error('NFT is already collateralized');
      }
  
      // 3. Check approval with retry
      let stillApproved = false;
      const [approvedAddress, isApprovedForAll] = await Promise.all([
        assetTokenContract.getApproved(tokenId),
        assetTokenContract.isApprovedForAll(account, lendingPoolAddress)
      ]);
      
      stillApproved = approvedAddress === lendingPoolAddress || isApprovedForAll;
  
      if (!stillApproved) {
        const approveTx = await assetTokenContract.approve(lendingPoolAddress, tokenId, {
          gasLimit: 200000
        });
        await approveTx.wait();
        
        // Re-check approval after update
        const [newApproved, newApprovedAll] = await Promise.all([
          assetTokenContract.getApproved(tokenId),
          assetTokenContract.isApprovedForAll(account, lendingPoolAddress)
        ]);
        stillApproved = newApproved === lendingPoolAddress || newApprovedAll;
        
        if (!stillApproved) {
          throw new Error('Approval failed. Try again.');
        }
      }
  
      // 4. Estimate gas with buffer
      const amountWei = ethers.utils.parseEther(borrowAmount);
      const gasEstimate = await lendingPoolContract.estimateGas.borrow(
        tokenId,
        amountWei
      );
  
      // 5. Execute borrow with dynamic gas
      const tx = await lendingPoolContract.borrow(tokenId, amountWei, {
        gasLimit: gasEstimate.mul(150).div(100) // 50% buffer
      });
  
      const receipt = await tx.wait();
      console.log('Borrow receipt:', receipt);
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted');
      }
  
      alert('Borrow successful!');
      window.location.reload();
  
    } catch (err) {
      console.error('BORROW ERROR:', {
        rawError: err,
        message: err.message,
        reason: err.reason,
        data: err.data
      });
  
      // Handle specific error cases
      let errorMessage = 'Borrow failed';
      
      if (err.code === -32603) {
        errorMessage = 'Transaction failed: Check your gas limit and try again';
      } else if (err.data) {
        try {
          const decodedError = lendingPoolContract.interface.parseError(err.data);
          errorMessage += `: ${decodedError.name}`;
        } catch (e) {
          errorMessage += ' (Contract reverted)';
        }
      } else if (err.reason) {
        errorMessage += `: ${err.reason}`;
      } else {
        errorMessage += `: ${err.message}`;
      }
  
      setError(errorMessage);
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white">
      <h3 className="text-xl font-bold mb-2">Token ID: {asset.tokenId}</h3>
      
      {!connected ? (
        <button 
          onClick={connect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <div className="mb-4">
            <button
              onClick={approveAsset}
              disabled={isApproving || isApproved}
              className={`px-4 py-2 rounded text-white ${
                isApproved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
              } ${isApproving ? 'opacity-50' : ''}`}
            >
              {isApproving ? 'Approving...' : 
               isApproved ? 'Approved ✅' : 'Approve Asset'}
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="number"
              placeholder="Amount to borrow"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="w-full p-2 border rounded"
              min="0"
              step="0.01"
            />
            
            <button
              onClick={borrowAgainstAsset}
              disabled={isBorrowing || !isApproved}
              className={`w-full px-4 py-2 rounded text-white ${
                isBorrowing ? 'bg-gray-500' : 'bg-purple-500 hover:bg-purple-600'
              } ${!isApproved ? 'opacity-50' : ''}`}
            >
              {isBorrowing ? 'Processing...' : 'Borrow'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
          {error.includes('RPC error') && (
            <div className="mt-1 text-xs">
              Try: 1) Resetting MetaMask 2) Increasing gas limit 3) Switching networks
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AssetCard;