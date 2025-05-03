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
    <div className='p-8 bg-blue-50 min-h-screen'>
      <h1 className='text-4xl font-extrabold text-blue-800 mb-8'>📊 FTI Lending Dashboard</h1>

      <div className='flex justify-between items-center mb-8'>
        <Link
          to='/tokenize'
          className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700'
        >
          ➕ Tokenize New Asset
        </Link>

        <div className='text-right'>
          <h2 className='text-lg font-semibold text-gray-700'>💼 Wallet Balance</h2>
          <p className='text-xl font-bold text-blue-900'>💰 {balance}   DAI</p>
          <button
            onClick={loadBalance}
            className='mt-2 mr-2 px-4 py-1 bg-blue-400 text-white rounded hover:bg-blue-500'
          >
            Refresh
          </button>
          <button
            onClick={addDai}
            className='mt-2 px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600'
          >
            Add 10 DAI (Dev)
          </button>
        </div>
      </div>

      <section className='mb-12'>
        <h2 className='text-2xl font-bold text-blue-700 mb-4'>🏷️ My Tokenized Assets</h2>
        {loadingAssets ? (
          <p className='text-gray-500'>Loading your assets...</p>
        ) : assets.length === 0 ? (
          <p className='text-gray-500'>No tokenized assets found.</p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {assets.map((asset) => (
              <AssetCard key={asset.tokenId} asset={asset} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className='text-2xl font-bold text-blue-700 mb-4'>💳 My Loans</h2>
        {loadingLoans ? (
          <p className='text-gray-500'>Loading your loans...</p>
        ) : loans.length === 0 ? (
          <p className='text-gray-500'>No loans found.</p>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
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