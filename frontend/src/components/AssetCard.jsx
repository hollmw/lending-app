import { useState } from 'react';
import { ethers } from 'ethers';
import axios from '../services/api';
import AssetTokenABI from '../abis/AssetToken.json'; // Make sure you have ABI!

const assetTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // <<<< PUT your real AssetToken address
const lendingPoolAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'; // <<<< PUT your real LendingPool address

function AssetCard({ asset }) {
    const [borrowAmount, setBorrowAmount] = useState('');
    const [approving, setApproving] = useState(false);
    const [borrowing, setBorrowing] = useState(false);
  
    const approveAsset = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, signer);
  
        const tx = await assetTokenContract.approve(lendingPoolAddress, asset.tokenId);
        await tx.wait();
  
        alert('Approval successful!');
      } catch (error) {
        console.error('Error approving asset', error);
        alert('Error approving asset: ' + (error.reason || error.message));
      }
    };
  
    const borrowAgainstAsset = async () => {
      if (!borrowAmount) {
        alert('Please enter borrow amount.');
        return;
      }
      try {
        setBorrowing(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
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