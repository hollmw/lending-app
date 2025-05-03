import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import { assetTokenAddress, lendingPoolAddress } from '../addresses';

function AssetCard({ asset }) {
  const { signer, account, connected, connect } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState(null);

  // On-chain fetch of asset name
  const [assetName, setAssetName] = useState('');
  useEffect(() => {
    if (!signer) return;
    const fetchName = async () => {
      try {
        const contract = new ethers.Contract(
          assetTokenAddress,
          AssetTokenABI.abi,
          signer
        );
        const name = await contract.getName(asset.tokenId);
        setAssetName(name);
      } catch (e) {
        console.error('Error fetching asset name:', e);
      }
    };
    fetchName();
  }, [signer, asset.tokenId]);

  // Extract and format valuation from tokenURI (in Wei) to DAI
  const [valuationDAI, setValuationDAI] = useState(null);
  useEffect(() => {
    const parseValuation = () => {
      const match = asset.tokenURI?.match(/Valuation:\s*(\d+)/);
      if (match) {
        try {
          const weiBN = ethers.BigNumber.from(match[1]);
          setValuationDAI(ethers.utils.formatEther(weiBN));
        } catch (e) {
          console.error('Valuation parsing error:', e);
        }
      }
    };
    parseValuation();
  }, [asset.tokenURI]);

  const maxBorrowable = valuationDAI ? (parseFloat(valuationDAI) * 0.7).toFixed(2) : '0.00';

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

  const borrowAgainstAsset = async () => {
    if (!connected) {
      await connect();
      return;
    }

    if (!borrowAmount || isNaN(borrowAmount)) {
      setError('Please enter a valid amount in DAI');
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

      const owner = await assetTokenContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You no longer own this NFT');
      }

      const existingLoanId = await lendingPoolContract.tokenToLoanId(tokenId);
      if (!existingLoanId.eq(0)) {
        throw new Error('NFT is already collateralized');
      }

      if (!isApproved) {
        const approveTx = await assetTokenContract.approve(lendingPoolAddress, tokenId);
        await approveTx.wait();
      }

      const amountWei = ethers.utils.parseEther(borrowAmount);
      if (amountWei.lte(0)) throw new Error('Invalid borrow amount');

      const valuationRes = await fetch(`http://localhost:8080/api/valuation/${tokenId}`);
      const { valuationWei, signature } = await valuationRes.json();

      const maxAllowed = ethers.BigNumber.from(valuationWei).mul(70).div(100);
      if (amountWei.gt(maxAllowed)) {
        alert(`Amount exceeds allowed limit: Max borrow is ${ethers.utils.formatEther(maxAllowed)} DAI`);
        setIsBorrowing(false);
        return;
      }

      const signatureBytes = ethers.utils.arrayify(signature);
      const gasEstimate = await lendingPoolContract.estimateGas.borrow(
        tokenId,
        amountWei,
        valuationWei,
        signatureBytes
      );

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
      window.location.reload();
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
      <h3 className="text-xl font-semibold">Name: {assetName || 'Loading...'}</h3>

      <p className="text-sm text-gray-600">
        💰 Valuation: {valuationDAI ? `${valuationDAI} DAI` : 'N/A'}
      </p>
      <p><strong>Max Borrowable (70% LTV):</strong> {maxBorrowable} DAI</p>

      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Amount to Borrow (DAI)</label>
        <input
          type="number"
          placeholder="Enter amount in DAI"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          className="w-full p-2 border border-blue-200 rounded-md"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={approveAsset}
          disabled={isApproving || isApproved}
          className={`flex-1 px-4 py-2 rounded text-white ${isApproved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'} ${isApproving ? 'opacity-50' : ''}`}
        >
          {isApproving ? 'Approving...' : isApproved ? 'Approved ✅' : 'Approve'}
        </button>

        <button
          onClick={borrowAgainstAsset}
          disabled={isBorrowing || !isApproved}
          className={`flex-1 px-4 py-2 rounded text-white ${isBorrowing ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'} ${!isApproved ? 'opacity-50' : ''}`}
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
