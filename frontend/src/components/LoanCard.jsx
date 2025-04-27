function LoanCard({ loan }) {
    const repayLoan = async (loanId) => {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();
      
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
        <p className="font-bold text-green-600">{loan.status}</p>
      </div>
    );
  }
  
  export default LoanCard;
  