import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import { assetTokenAddress, lendingPoolAddress } from '../addresses';

// @dev Component to display a single asset and allow user to borrow against it

function AssetCard({ asset }) {
  // @dev Extract wallet-related state
  const { signer, account, connected, connect } = useWallet();

  // @dev Local state for borrow amount, approval status, and UI flags
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState(null);

  // @dev Parse raw valuation (in wei) from tokenURI and compute max borrowable (70% LTV)
  const rawValuation = asset.tokenURI;
  const daiValuation = rawValuation ? ethers.utils.formatEther(rawValuation) : "0.0";
  const maxBorrowable = parseFloat(daiValuation) * 0.7;

  // @dev On mount and whenever relevant data changes, check if asset is approved for the LendingPool
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
          assetTokenContract.isApprovedForAll(account, lendingPoolAddress),
        ]);
        setIsApproved(
          approvedAddress === lendingPoolAddress || isApprovedForAll
        );
      } catch (err) {
        console.error('Approval check error:', err);
        setIsApproved(false);
      }
    };

    checkApproval();
  }, [connected, account, asset.tokenId, signer]);

  // @dev Approve the LendingPool contract to transfer the specified NFT
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

      const tx = await assetTokenContract.approve(lendingPoolAddress, asset.tokenId);
      await tx.wait();
      setIsApproved(true);
    } catch (err) {
      console.error('Approval failed:', err);
      setError(`Approval failed: ${err.reason || err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // @dev Handle borrowing logic: check ownership, collateral status, approval, valuation, then borrow
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

      // @dev Instantiate contracts
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);
      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, signer);
      const tokenId = asset.tokenId;

      // @dev Ensure user still owns the NFT
      const owner = await assetTokenContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You no longer own this NFT');
      }

      // @dev Check if NFT is already used as collateral
      const existingLoanId = await lendingPoolContract.tokenToLoanId(tokenId);
      if (!existingLoanId.eq(0)) {
        throw new Error('NFT is already collateralized');
      }

      // @dev Ensure NFT is approved for transfer by LendingPool
      const [approvedAddress, isApprovedForAll] = await Promise.all([
        assetTokenContract.getApproved(tokenId),
        assetTokenContract.isApprovedForAll(account, lendingPoolAddress),
      ]);
      const stillApproved = approvedAddress === lendingPoolAddress || isApprovedForAll;
      if (!stillApproved) {
        const approveTx = await assetTokenContract.approve(lendingPoolAddress, tokenId);
        await approveTx.wait();
      }

      // @dev Validate borrow amount and convert to wei
      const amountWei = ethers.utils.parseEther(borrowAmount);
      if (amountWei.lte(0)) throw new Error('Invalid borrow amount');

      // @dev Fetch signed valuation from oracle backend
      const valuationRes = await fetch(`http://localhost:8080/api/valuation/${tokenId}`);
      const { valuationWei, signature, oracleSignerAddress } = await valuationRes.json();

      // @dev Enforce 70% LTV policy
      const maxAllowed = ethers.BigNumber.from(valuationWei).mul(70).div(100);
      if (amountWei.gt(maxAllowed)) {
        alert(`Amount exceeds allowed limit: Max borrow is ${ethers.utils.formatEther(maxAllowed)} DAI`);
        setIsBorrowing(false);
        return;
      }

      // @dev Convert signature to bytes and estimate gas
      const signatureBytes = ethers.utils.arrayify(signature);
      const gasEstimate = await lendingPoolContract.estimateGas.borrow(
        tokenId,
        amountWei,
        valuationWei,
        signatureBytes
      );

      // @dev Send borrow transaction with a buffer over estimated gas
      const tx = await lendingPoolContract.borrow(
        tokenId,
        amountWei,
        valuationWei,
        signatureBytes,
        {
          gasLimit: gasEstimate.mul(120).div(100),
        }
      );
      await tx.wait();

      alert('Borrow successful!');
      window.location.reload(); // @dev Refresh to update dashboard
    } catch (err) {
      console.error('BORROW ERROR:', err);
      setError(err.reason || err.message || 'Borrow failed');
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="border rounded-xl p-6 shadow-lg bg-fti-light text-fti-blue space-y-4">
      <h3 className="text-2xl font-semibold">Asset #{asset.tokenId}</h3>
      <h3 className="text-xl font-semibold">Name: </h3>

      <p className="text-sm text-gray-600">
        💰 Valuation: {daiValuation} DAI
      </p>
      <p><strong>Max Borrowable (70% LTV):</strong> {maxBorrowable.toLocaleString()} DAI</p>

      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Amount to Borrow</label>
        <input
          type="number"
          placeholder="70% LTV"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          className="w-full p-2 border border-blue-200 rounded-md"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={approveAsset}
          disabled={isApproving || isApproved}
          className={`flex-1 px-4 py-2 rounded text-white ${
            isApproved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
          } ${isApproving ? 'opacity-50' : ''}`}
        >
          {isApproving ? 'Approving...' : isApproved ? 'Approved ✅' : 'Approve'}
        </button>

        <button
          onClick={borrowAgainstAsset}
          disabled={isBorrowing || !isApproved}
          className={`flex-1 px-4 py-2 rounded text-white ${
            isBorrowing ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'
          } ${!isApproved ? 'opacity-50' : ''}`}
        >
          {isBorrowing ? 'Borrowing...' : 'Borrow'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

export default AssetCard;
