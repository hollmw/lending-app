import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import LendingPoolABI from '../abis/LendingPool.json';

const lendingPoolAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

function LoanCard({ loan }) {
  const { signer, connected } = useWallet();

  const repayLoan = async (loanId) => {
    if (!connected) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, signer);

      const tx = await lendingPoolContract.repay(loanId);
      await tx.wait();

      alert('Loan repaid successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error repaying loan', error);
      alert('Error repaying loan: ' + (error.reason || error.message));
    }
  };

  return (
    <div className="border rounded-lg p-6 shadow-md bg-white">
      <h3 className="text-xl font-bold mb-2">Loan ID: {loan.loanId}</h3>
      <p className="mb-2">Amount: {loan.amount.toString()} wei</p>
      <p className="mb-2">Interest Due: {loan.interestDue.toString()} wei</p>
      <p className="font-bold text-green-600">{loan.isActive ? 'Active' : 'Repaid'}</p>

      {loan.isActive && (
        <button
          onClick={() => repayLoan(loan.loanId)}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Repay Loan
        </button>
      )}
    </div>
  );
}

export default LoanCard;
