import { useState } from 'react';
import axios from '../services/api';

function Tokenize() {
  const [assetName, setAssetName] = useState('');
  const [price, setPrice] = useState(null);

  const lookupAsset = async () => {
    try {
      const res = await axios.get(`/oracle-lookup?assetName=${assetName}`);
      setPrice(res.data.price);
    } catch (error) {
      console.error('Oracle lookup error', error);
    }
  };

  const tokenizeAsset = async () => {
    try {
      await axios.post('/tokenize', {
        to: window.ethereum.selectedAddress,
        tokenURI: `Asset: ${assetName}, Valuation: $${price}`
      });
      alert('Asset tokenized successfully!');
    } catch (error) {
      console.error('Tokenize error', error);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-6">Tokenize New Asset</h1>
      <input
        type="text"
        placeholder="Enter asset name (e.g. Tesla Model S)"
        value={assetName}
        onChange={(e) => setAssetName(e.target.value)}
        className="border p-2 mb-4 w-80"
      />
      <button onClick={lookupAsset} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 mb-4">
        Lookup Asset Valuation
      </button>

      {price && (
        <>
          <p className="mb-4 text-green-600">Estimated Value: ${price}</p>
          <button onClick={tokenizeAsset} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700">
            Tokenize Asset
          </button>
        </>
      )}
    </div>
  );
}

export default Tokenize;
