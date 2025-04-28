import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import LendingPoolABI from '../abis/LendingPool.json';

const lendingPoolAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'; // Update

function MyLoans() {
  const { provider, walletAddress, connected } = useWallet();
  const [loans, setLoans] = useState([]);

  const fetchLoans = async () => {
    try {
      if (!connected) {
        console.error('Wallet not connected');
        return;
      }

      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, provider);

      const loanIds = await lendingPoolContract.getLoansByAddress(walletAddress);

      const loanData = await Promise.all(loanIds.map(async (loanId) => {
        const loan = await lendingPoolContract.loans(loanId);
        return {
          loanId: loanId.toString(),
          tokenId: loan.tokenId.toString(),
          amount: loan.amount.toString(),
          interestDue: loan.interestDue.toString(),
          isActive: loan.isActive,
        };
      }));

      setLoans(loanData);
    } catch (error) {
      console.error('Error fetching loans', error);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchLoans();
    }
  }, [connected]);

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">My Loans</h2>
      {loans.length === 0 ? (
        <p>No loans found.</p>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.loanId} className="border p-4 rounded bg-white shadow">
              <p><strong>Loan ID:</strong> {loan.loanId}</p>
              <p><strong>Token ID:</strong> {loan.tokenId}</p>
              <p><strong>Amount:</strong> {loan.amount} wei</p>
              <p><strong>Interest Due:</strong> {loan.interestDue} wei</p>
              <p><strong>Status:</strong> {loan.isActive ? 'Active' : 'Repaid'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyLoans;
