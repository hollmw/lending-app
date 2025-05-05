import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import LendingPoolABI from '../abis/LendingPool.json';
import MockDAIABI from '../abis/MockDAI.json';
import { lendingPoolAddress, mockDaiAddress } from '../addresses';

// @dev Component to display a loan summary and allow repayment
function LoanCard({ loan }) {
  const { signer, connected } = useWallet();

  /**
   * @dev Handles full repayment of a loan:
   *  1. Approves DAI if needed
   *  2. Calls `repay()` on LendingPool
   *  3. Shows result and reloads UI
   */
  const repayLoan = async (loanId) => {
    if (!connected || !signer) return alert('Connect wallet first!');

    try {
      // @dev Initialize contract instances
      const dai = new ethers.Contract(mockDaiAddress, MockDAIABI.abi, signer);
      const lendingPool = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, signer);

      // @dev Get on-chain loan data to calculate total amount due
      const onChainLoan = await lendingPool.loans(loanId);
      const totalDue = onChainLoan.amount.add(onChainLoan.interestDue);

      // @dev Check DAI allowance and approve if not enough
      const userAddress = await signer.getAddress();
      const allowance = await dai.allowance(userAddress, lendingPoolAddress);

      if (allowance.lt(totalDue)) {
        const approvalTx = await dai.approve(lendingPoolAddress, totalDue);
        await approvalTx.wait();
      }

      // @dev Call repay function on LendingPool contract
      const tx = await lendingPool.repay(loanId);
      await tx.wait();

      alert('✅ Loan repaid successfully!');
      window.location.reload(); // @dev Reload to update loan list and balance
    } catch (err) {
      console.error('Repay error:', err);
      alert('Repay failed: ' + (err.reason || err.message));
    }
  };

  /**
   * @dev Utility to format DAI values from wei to human-readable string
   */
  const formatWei = (value) => {
    return Number(ethers.utils.formatEther(value)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  // @dev Render loan details and repay button if loan is active
  return (
    <div className="border p-4 bg-white rounded shadow">
      {/* Display loan metadata */}
      <p><strong>Loan ID:</strong> {loan.loanId}</p>
      <p><strong>Token ID:</strong> {loan.tokenId}</p>
      <p><strong>Amount:</strong> {formatWei(loan.amount)} DAI</p>
      <p><strong>Interest Due:</strong> {formatWei(loan.interestDue)} DAI</p>
      <p><strong>Status:</strong> {loan.isActive ? 'Active' : 'Repaid'}</p>

      {/* Show repay button only for active loans */}
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