import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetCard from '../components/AssetCard';
import LoanCard from '../components/LoanCard';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import MockDAIABI from '../abis/MockDAI.json';

import { assetTokenAddress, lendingPoolAddress, mockDaiAddress } from '../addresses';

function Dashboard() {
  const { provider, signer, account, connected } = useWallet();
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [balance, setBalance] = useState('0.0');

  const loadBalance = async () => {
    if (!connected || !account || !(signer || provider)) return;

    try {
      const daiContract = new ethers.Contract(
        mockDaiAddress,
        MockDAIABI.abi,
        signer || provider 
      );

      const rawBalance = await daiContract.balanceOf(account);
      const formatted = ethers.utils.formatEther(rawBalance);
      setBalance(formatted);
    } catch (err) {
      console.error('🔴 Error loading DAI balance:', err);
      setBalance('0.0');
    }
  };

  const addDai = async () => {
    if (!connected || !signer) return;
    try {
      const dai = new ethers.Contract(mockDaiAddress, MockDAIABI.abi, signer);
      const tx = await dai.mint(account, ethers.utils.parseEther('10'));
      await tx.wait();
      await loadBalance();
    } catch (err) {
      console.error('DAI mint error:', err);
    }
  };

  const fetchAssets = async () => {
    if (!connected || !account) {
      console.error('Wallet not connected or missing address');
      return;
    }

    try {
      setLoadingAssets(true);
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI.abi, provider);
      const balanceBN = await assetTokenContract.balanceOf(account);

      const assetPromises = [];
      for (let i = 0; i < balanceBN.toNumber(); i++) {
        assetPromises.push((async () => {
          const tokenId = await assetTokenContract.tokenOfOwnerByIndex(account, i);
          const tokenURI = await assetTokenContract.tokenURI(tokenId);
          return {
            tokenId: tokenId.toString(),
            tokenURI,
          };
        })());
      }

      const assetList = await Promise.all(assetPromises);
      setAssets(assetList);
    } catch (error) {
      console.error('[fetchAssets] Error:', error);
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchLoans = async () => {
    if (!connected || !account) return;

    try {
      setLoadingLoans(true);
      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, provider);
      const loanIds = await lendingPoolContract.getUserLoans(account);

      const loanPromises = loanIds.map(async (loanId) => {
        const loan = await lendingPoolContract.loans(loanId);
        return {
          loanId: loanId.toString(),
          tokenId: loan.tokenId.toString(),
          amount: loan.amount.toString(),
          interestDue: loan.interestDue.toString(),
          isActive: loan.isActive,
        };
      });

      const loanList = await Promise.all(loanPromises);
      setLoans(loanList);
    } catch (error) {
      console.error('[fetchLoans] Error:', error);
      setLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  useEffect(() => {
    if (connected && account) {
      fetchAssets();
      fetchLoans();
      loadBalance();
    }
  }, [connected, account]);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-extrabold text-blue-800 mb-10 text-center">
        📊 Lending Dashboard
      </h1>
  
      <div className="w-full max-w-6xl flex flex-col lg:flex-row justify-between items-center lg:items-start mb-10 space-y-6 lg:space-y-0 lg:space-x-8">
        <Link
          to="/tokenize"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700"
        >
          ➕ Tokenize New Asset
        </Link>
  
        <div className="text-center lg:text-right">
          <h2 className="text-lg font-semibold text-gray-700">💼 Wallet Balance</h2>
          <p className="text-2xl font-bold text-blue-900">💰 {balance} DAI</p>
          <div className="mt-2 flex justify-center lg:justify-end space-x-2">
            <button
              onClick={loadBalance}
              className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500"
            >
              Refresh
            </button>
            <button
              onClick={addDai}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add 10 DAI (Dev)
            </button>
          </div>
        </div>
      </div>
  
      <section className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">🏷️ My Tokenized Assets</h2>
        {loadingAssets ? (
          <p className="text-gray-500 text-center">Loading your assets...</p>
        ) : assets.length === 0 ? (
          <p className="text-gray-500 text-center">No tokenized assets found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <AssetCard key={asset.tokenId} asset={asset} />
            ))}
          </div>
        )}
      </section>
  
      <section className="w-full max-w-6xl">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">💳 My Loans</h2>
        {loadingLoans ? (
          <p className="text-gray-500 text-center">Loading your loans...</p>
        ) : loans.length === 0 ? (
          <p className="text-gray-500 text-center">No loans found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <LoanCard key={loan.loanId} loan={loan} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
  
}

export default Dashboard;