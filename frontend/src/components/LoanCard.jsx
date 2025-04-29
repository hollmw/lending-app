import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import LendingPoolABI from '../abis/LendingPool.json';
import { lendingPoolAddress } from '../addresses';

function LoanCard({ loan }) {
  const { signer, connected } = useWallet();

  const repayLoan = async (loanId) => {
    if (!connected) return alert('Connect wallet first!');
    try {
      const contract = new ethers.Contract(lendingPoolAddress, LendingPoolABI, signer);
      const tx = await contract.repay(loanId);
      await tx.wait();
      alert('Loan repaid!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Repay failed: ' + (err.reason || err.message));
    }
  };

  return (
    <div className="border p-4 bg-white rounded shadow">
      <p><strong>Loan ID:</strong> {loan.loanId}</p>
      <p><strong>Token ID:</strong> {loan.tokenId}</p>
      <p><strong>Amount:</strong> {loan.amount} wei</p>
      <p><strong>Interest Due:</strong> {loan.interestDue} wei</p>
      <p><strong>Status:</strong> {loan.isActive ? 'Active' : 'Repaid'}</p>
      {loan.isActive && (
        <button
          onClick={() => repayLoan(loan.loanId)}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Repay Loan
        </button>
      )}
    </div>
  );
}

export default LoanCard;
