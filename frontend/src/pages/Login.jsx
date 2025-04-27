import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [account, setAccount] = useState('');
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        navigate('/dashboard');
      } catch (error) {
        console.error('Metamask connect error', error);
      }
    } else {
      alert('Please install Metamask!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl mb-6 font-bold">Connect Your Wallet</h1>
      <button onClick={connectWallet} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
        Connect Metamask
      </button>
      {account && (
        <p className="mt-4 text-green-600">Connected: {account}</p>
      )}
    </div>
  );
}

export default Login;
