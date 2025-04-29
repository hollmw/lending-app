import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import AssetCard from '../components/AssetCard';
import LoanCard from '../components/LoanCard';
import AssetTokenABI from '../abis/AssetToken.json';
import LendingPoolABI from '../abis/LendingPool.json';
import { assetTokenAddress, lendingPoolAddress } from '../addresses';

function Dashboard() {
  const { provider, walletAddress, connected } = useWallet();
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // === Fetch Owned Assets ===
  const fetchAssets = async () => {
    if (!connected || !walletAddress) {
      console.error('Wallet not connected or missing address');
      return;
    }

    try {
      setLoadingAssets(true);
      const assetTokenContract = new ethers.Contract(assetTokenAddress, AssetTokenABI, provider);
      const balance = await assetTokenContract.balanceOf(walletAddress);

      const assetPromises = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        assetPromises.push((async () => {
          const tokenId = await assetTokenContract.tokenOfOwnerByIndex(walletAddress, i);
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
      console.error('[fetchAssets] Error:', error);
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  // === Fetch Loans ===
  const fetchLoans = async () => {
    if (!connected || !walletAddress) return;
    try {
      setLoadingLoans(true);
      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI, provider);
      const loanIds = await lendingPoolContract.getUserLoans(walletAddress);

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
    if (connected && walletAddress) {
      fetchAssets();
      fetchLoans();
    }
  }, [connected, walletAddress]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="mb-8">
        <Link
          to="/tokenize"
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Tokenize New Asset
        </Link>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">My Tokenized Assets</h2>
        {loadingAssets ? (
          <p>Loading your assets...</p>
        ) : assets.length === 0 ? (
          <p>No tokenized assets found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <AssetCard key={asset.tokenId} asset={asset} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">My Loans</h2>
        {loadingLoans ? (
          <p>Loading your loans...</p>
        ) : loans.length === 0 ? (
          <p>No loans found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <LoanCard key={loan.loanId} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
