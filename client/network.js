const networkConfigs = {
  1: { // "0x1"
    currencySymbol: "ETH",
    chainName: "Ethereum mainnet",
    blockExplorerUrl: "https://etherscan.io/",
    wrapped: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    nftContractAddress: "0x1-NoContract",
  },
  3: { // "0x3"
    chainName: "Ropsten testnet",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://ropsten.etherscan.io/",
    nftContractAddress: "0x3-NoContract",
  },
  42: { // "0x2a"
    chainName: "Kovan testnet",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://kovan.etherscan.io/",
    nftContractAddress: "0x2a-NoContract",
    },
  4: { // "0x4"
    chainName: "Rinkeby testnet",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://rinkeby.etherscan.io/",
    nftContractAddress: "0xa2BE1aBc6B869675283245f2ef7566762Bde00d6",
  },
  5: { // "0x5"
    chainName: "Goerli testnet",
    currencySymbol: "ETH",
    blockExplorerUrl: "https://goerli.etherscan.io/",
    nftContractAddress: "0x5-NoContract",
  },
  1337: { // "0x539"
    chainName: "Local Chain",
    currencyName: "ETH",
    currencySymbol: "ETH",
    rpcUrl: "http://127.0.0.1:7545",
    nftContractAddress: "0x539-NoContract",
  },
  43114: { // "0xa86a"
    chainName: "Avalanche Mainnet",
    currencyName: "AVAX",
    currencySymbol: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorerUrl: "https://cchain.explorer.avax.network/",
    nftContractAddress: "0xa86a-NoContract",
  },
  56: { // "0x38"
    chainName: "Binance Smart Chain",
    currencyName: "BNB",
    currencySymbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorerUrl: "https://bscscan.com/",
    wrapped: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    nftContractAddress: "0x38-NoContract",
  },
  97: { // "0x61"
    chainName: "Binance Smart Chain - Testnet",
    currencyName: "BNB",
    currencySymbol: "BNB",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    blockExplorerUrl: "https://testnet.bscscan.com/",
    nftContractAddress: "0x61-NoContract",
  },
  137: { // "0x89"
    chainName: "Polygon Mainnet",
    currencyName: "MATIC",
    currencySymbol: "MATIC",
    rpcUrl: "https://rpc-mainnet.maticvigil.com/",
    blockExplorerUrl: "https://explorer-mainnet.maticvigil.com/",
    wrapped: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    nftContractAddress: "0x89-NoContract",
  },
  80001: { // "0x13881"
    chainName: "Mumbai testnet",
    currencyName: "MATIC",
    currencySymbol: "MATIC",
    rpcUrl: "https://rpc-mumbai.matic.today/",
    blockExplorerUrl: "https://mumbai.polygonscan.com/",
    nftContractAddress: "0x311b0b8332aD87833dCD1016599A09E1bc3eD9F1", // 12mei22 0943
  },
  5777: { // "0x539", // "0x1691",
    chainName: "Ganache local net",
    currencyName: "ETH",
    currencySymbol: "ETH",
    rpcUrl: "HTTP://127.0.0.1:8545",
    blockExplorerUrl: "",
    nftContractAddress: "0x16e644546291Bd4C7827ADBF085120045ef0d5ce",
  },
};

const getSymbolByChain = (chain) => networkConfigs[chain]?.currencySymbol || "NATIVE";
const getBlockExplorerUrl = (chain) => networkConfigs[chain]?.blockExplorerUrl;
const getWrappedNative = (chain) => networkConfigs[chain]?.wrapped || null;
const getNftContractAddress = (chain) => networkConfigs[chain]?.nftContractAddress || null;
const getChainTitle = (chain) => {
  return getSymbolByChain(chain) + ' ' + networkConfigs[chain]?.chainName;
};
