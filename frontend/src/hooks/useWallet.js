import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [connected, setConnected] = useState(false);


  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        alert('Please install Metamask!');
        return;
      }
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);

      try {
        const accounts = await web3Provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
          setWalletAddress(accounts[0]);
          setConnected(true);
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        setConnected(false);
      }
    };

    connectWallet();
  }, []);

  return { provider, signer, walletAddress, connected };
}
