import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import LendingPoolABI from '../abis/LendingPool.json';
import MockDAIABI from '../abis/MockDAI.json';
import { lendingPoolAddress, mockDaiAddress } from '../addresses';

function LoanCard({ loan }) {
  const { signer, connected } = useWallet();

  const repayLoan = async (loanId) => {
    if (!connected || !signer) return alert('Connect wallet first!');

    try {
      const dai = new ethers.Contract(mockDaiAddress, MockDAIABI.abi, signer);
      const lendingPool = new ethers.Contract(lendingPoolAddress, LendingPoolABI.abi, signer);

      const onChainLoan = await lendingPool.loans(loanId);
      const totalDue = onChainLoan.amount.add(onChainLoan.interestDue);

      const userAddress = await signer.getAddress();
      const allowance = await dai.allowance(userAddress, lendingPoolAddress);

      if (allowance.lt(totalDue)) {
        const approvalTx = await dai.approve(lendingPoolAddress, totalDue);
        await approvalTx.wait();
      }

      // Call repay
      const tx = await lendingPool.repay(loanId);
      await tx.wait();

      alert('✅ Loan repaid successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Repay error:', err);
      alert('Repay failed: ' + (err.reason || err.message));
    }
  };

  const formatWei = (value) => {
    return Number(ethers.utils.formatEther(value)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  return (
    <div className="border p-4 bg-white rounded shadow">
      <p><strong>Loan ID:</strong> {loan.loanId}</p>
      <p><strong>Token ID:</strong> {loan.tokenId}</p>
      <p><strong>Amount:</strong> {formatWei(loan.amount)} DAI</p>
      <p><strong>Interest Due:</strong> {formatWei(loan.interestDue)} DAI</p>
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
