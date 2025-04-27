import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AssetCard from '../components/AssetCard';
import LoanCard from '../components/LoanCard';
import axios from '../services/api';

function Dashboard() {
  const [walletAddress, setWalletAddress] = useState('');
  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      fetchAssetsAndLoans(accounts[0]);
    } else {
      alert('Please install Metamask!');
    }
  };

  const fetchAssetsAndLoans = async (wallet) => {
    try {
      setLoading(true);
      const assetsRes = await axios.get(`/my-assets?wallet=${wallet}`);
      const loansRes = await axios.get(`/my-loans?wallet=${wallet}`);
      setAssets(assetsRes.data);
      setLoans(loansRes.data);
    } catch (error) {
      console.error('Error fetching assets or loans', error);
    } finally {
      setLoading(false);
    }
  };

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

      {loading ? (
        <p>Loading your data...</p>
      ) : (
        <>
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">My Tokenized Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.length === 0 ? (
                <p>No assets found.</p>
              ) : (
                assets.map((asset) => (
                  <AssetCard key={asset.tokenId} asset={asset} />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">My Loans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.length === 0 ? (
                <p>No loans found.</p>
              ) : (
                loans.map((loan) => (
                  <LoanCard key={loan.loanId} loan={loan} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
