# jsNFTDemo
Demo in plain Javascript as NFT marketplace app

Git clone to a local map:
> $ git clone https://github.com/dAppITnl/jsNFTDemo.git

## To start initialize:
Enter from (gitbash) prompt:
```
$ npm install
$ npm audit
$ npm audit fix --force
```

### Metamask
Install **Metamask** as browser plugin and store the 12 secret words into the .secret file (single line)

See: https://metamask.io/

#### Add networks (Settings -> Networks -> Add network)
For local (Ganache) blockchain (click 'network' in left menu and select 'Ganache' and (correct to)):
- Networkname: Localhost 8545 (or what you prefer)
- RPC-Url: http://localhost:8545
- Chain ID: 1337
- Currency Symbol: DN (The contract has "DN" ("DemoNFTs") defined as local token (coin), but not used.)
- Block Explorer URL: (leave empty: in Ganache click "Blocks", "Transactions", "Contracts" or "Events")

For other (testnet) blockchains: select in the network list if not already added

## Local testnet (Ganache) use:

### Ganache
Install / run ganache app and create a workspace

See: https://trufflesuite.com/ganache/

#### with (update settings if different):
- RPC server: http://127.0.0.1:8545 (same portnumber as in Metamask)
- Network ID: 5777

### Truffle
Install truffle to compile contract(s):

See: https://trufflesuite.com/docs/truffle/getting-started/installation/

#### Compile and add contract to ganache node (settings in truffle-config.js):
> $ truffle migrate --reset --network ganache

From this output under `Deploying 'Nftcontract'` copy (replace) the `contract address`-value into the `network.js` file, under `"0x539"` (= `Ganache local net`) as the `nftContractAddress`-value.

If the Nftcontract.sol is changed: copy from build/contracts/Nftcontract.json the `"abi": [ .. ]` block (line 3 until approx 661 (till "metadata")) into file client/abi.js as `const abi = [ .. ];`

### Local webserver (Phython3) to run the app:
Install Python3 to have a local webserver available (or equal):

See: https://www.python.org/ -> Download -> Files

Run app locally (at whatever portnr you prefer):
> $ python3 -m http.server:7000 

Open webbrowser and surf to: localhost:7000

## Blockchain (test)net use:

### Remix
Surf to https://remix.ethereum.org:
- Set Metamask to a (test)network, select an account with some / enough balance
  - For a testnet increase the balance via a `faucet` website, google search for 'faucet' and the testnet name
  - ex.: https://faucet.metamask.io/ for one of the Ethereum testnets
  - ex.: https://faucets.chain.link/rinkeby for 0.1 ETH at Rinkeby testnet  
  - ex.: https://faucet.rinkeby.io/ -> first create a (twitter) tweet with the Metamask account address and copy the tweet url here and request an amount
  - ex.: https://faucet.dimensions.network/ for 1 rETH at Ropsten testnet
- under `Solidity compiler`: activate `Auto compile`
- under `File explorers` open `contracts` folder and click the `Load a local file into current workspace`-iconbutton and upload these files (in local `contracts` folder):
  - Ownable.sol
  - IERC721Receiver.sol
  - Nftcontract.sol
- open the `Nftcontract.sol` file (double click)
- under `Solidity compiler`:
  - under `Contract` select the `Nftcontract`
  - scroll down and copy the `ABI` data and replace it into the `abi.js` file after `const abi =`
- under `Deploy & run transactions`:
  - set `Environment` to `Injected Web3`
  - check / set `Account` to the Metamask account
  - check / set `Contract` to the `Nftcontract`
  - click `Deploy`-button and wait till deployment is finished at the (test)network, accpeting the Metamask actions
  - under `Deployed contracts` copy the address and paste it into the `network.js` file for the here used network, see above.

run the app as above, with Metamask set to the (test)network for which it is deployed from `client` map
ex.: python3 -m http.server 3000
browser: http://localhost:3000

Install (only) client map contents at a webroot to run from a webserver.

## Test Metadata hash-es:
- QmWf8GthBR1mfswjoHrN3hTZegcAwWYuL7pCAGRkJcnn56 = emoji smiley twitter
- QmcaCDUMFu33G8WVn7sZVKegPuYzKhsWxH7Ktkw7iSQFXV = emoji ogre emojidex
