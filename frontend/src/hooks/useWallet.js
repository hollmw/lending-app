import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  const resetState = () => {
    setConnected(false);
    setAccount('');
    setSigner(null);
    setChainId(null);
  };

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setConnected(true);
    } else {
      resetState();
    }
  }, []);

  const handleChainChanged = useCallback((chainIdHex) => {
    setChainId(parseInt(chainIdHex, 16));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    const initialize = async () => {
      if (!provider) return;
      try {
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        }
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        setSigner(provider.getSigner());
      } catch (err) {
        console.error('Wallet init error:', err);
        resetState();
      }
    };

    initialize();
  }, [provider]);

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
      if (provider) {
        setSigner(provider.getSigner());
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      }
    } catch (err) {
      console.error('Connect error:', err);
      resetState();
    }
  };

  return { provider, signer, account, connected, chainId, connect, resetState };
}
