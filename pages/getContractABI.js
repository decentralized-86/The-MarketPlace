import axios from 'axios'; 

async function getContractABI(nftAddress, POLYGONSCAN_API_KEY) {
  try {
    const url = `https://api-testnet.polygonscan.com/api?module=contract&action=getabi&address=${nftAddress}&apikey=${POLYGONSCAN_API_KEY}`;
    const response = await axios.get(url);

    if (response.data.status !== '1') {
      throw new Error(response.data.message);
    }

    const contractABI = JSON.parse(response.data.result);

    return contractABI;
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    return null;
  }
}

export default getContractABI;
