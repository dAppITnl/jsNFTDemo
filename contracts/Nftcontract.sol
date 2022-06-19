// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

//import "./IERC721.sol";
import "./IERC721Receiver.sol";
import "./Ownable.sol";

contract Nftcontract is Ownable {
  string public constant Name = "DemoNFTs";
  string public constant Symbol = "DN";
  
  bytes4 internal constant MAGIC_ERC721_RECEIVED =
    bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));

  /*
    ERC721 signature:
    bytes4(keccak256('balanceOf(address)')) == 0x70a08231
    bytes4(keccak256('ownerOf(uint256)')) == 0x6352211e
    bytes4(keccak256('approve(address,uint256)')) == 0x095ea7b3
    bytes4(keccak256('getApproved(uint256)')) == 0x081812fc
    bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
    bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
    bytes4(keccak256('transferFrom(address,address,uint256)')) == 0x23b872dd
    bytes4(keccak256('safeTransferFrom(address,address,uint256)')) == 0x42842e0e
    bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)')) == 0xb88d4fde

    =>  0x70a08231 ^ 0x6352211e ^ 0x095ea7b3 ^ 0x081812fc ^ 0xa22cb465 ^
        0xe985e9c5 ^ 0x23b872dd ^ 0x42842e0e ^ 0xb88d4fde => 0x80ac58cd
  */
  bytes4 private constant _INTERFACE_ID_ERC721 = 
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('symbol()')) ^
    bytes4(keccak256('totalSupply()')) ^
    bytes4(keccak256('balanceOf(address)')) ^
    bytes4(keccak256('ownerOf(uint256)')) ^
    bytes4(keccak256('approve(address,uint256)')) ^
    bytes4(keccak256('transfer(address,uint256)')) ^
    bytes4(keccak256('transferFrom(address,address,uint256)')) ^
    bytes4(keccak256('tokensOfOwner(address)')) ^
    bytes4(keccak256('tokenMetadata(uint256,string)'));

  /* 
    ERC165 signature:
    bytes4(keccak256('supportsInterface(bytes4)')) => 0x01ffc9a7
  */
  bytes4 private constant _INTERFACE_ID_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

  // When NFT is created
  event NftCreated(address owner, uint256 nftId, string metadataUrl, uint256 created);
  // When NFT is transferred
  event Transfer(address from, address to, uint256 tokenId);
  event Approval(address owner, address approved, uint256 tokenId);

  /**
  * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
  */
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

  // NFT data in chain
  struct Nft {
    string metadataUrl;
    uint64 created;
  }
  Nft[] private allNfts; // index => nft id (token id)

  // get uint256 amount (token nft count) of owner address
  mapping (address => uint256) ownershipTokenCount;
  // get owner address of uint256 nft id (token id)
  mapping (uint256 => address) public nftIndexToOwner;
  // address which is approved (to tx it) for a nft id
  mapping (uint256 => address) public nftIndexToApproved;

  // MYADDRESS => OPERATORADDRESS => True|False : give an addess tx rights of all my Nfts
  // Ex.: _operatorApprovals[MYADDRESS][OPERATORADDRESS] -> True|False 
  mapping (address => mapping (address => bool)) private _operatorApprovals; 

  // Marketplace
  struct Offer {
    address payable seller;
    uint256 priceWEI;
    uint256 index;
    uint256 tokenId;
    bool active;
  }
  Offer[] private allOffers;

  mapping(uint256 => Offer) tokenIdToOffer;

  event MarketTransaction(string TxType, address owner, uint256 tokenId, uint256 priceWEI);

  // ==============

  constructor() public {
    // We are creating the first NFT at index 0  
    _createNft(string('-1'), address(0));
  }

  // ==============

  function supportsInterface(bytes4 _interfaceId) external pure returns (bool) {
    return ( (_interfaceId == _INTERFACE_ID_ERC165) || (_interfaceId == _INTERFACE_ID_ERC721) );
  }

  // ==============

  // anyone can create, owned by sender, no onlyOwner
  // Initially set as offer for initPriceWEI
  function createNft(string memory metadataUrl, uint256 initPriceWEI) public /*onlyOwner*/ {
    uint256 tokenId = _createNft(metadataUrl, msg.sender);
    setOffer(initPriceWEI, tokenId);
  }

  // creates the NFT internally
  function _createNft(string memory _metadataUrl, address _owner) internal returns (uint256) { // nft Id
    uint64 _now = uint64(now);
    Nft memory _nft = Nft({
      metadataUrl: _metadataUrl,
      created: _now
    });

    uint256 newNftId = allNfts.push(_nft) -1; // zero based Id

    // max 4 billion check.. sounds a lot, but let it never overflow
    require(newNftId == uint256(uint32(newNftId)), "Overflow in number of NFTs, max reached");

    // reply with created notification
    emit NftCreated(_owner, newNftId, _metadataUrl, uint256(_now));

    // assign ownership and emit the Tx event as per ERC721 draft
    _transfer(address(0), _owner, newNftId);

    return newNftId;
  }

  // gets NFT metadatUrl and created date as in chain
  function getNft(uint256 _id) public view returns(string memory metadataUrl, uint256 created) {
    Nft storage nft = allNfts[_id]; // storage is a pointer to the original mapping, memory creates a local copy

    metadataUrl = nft.metadataUrl;
    created = uint256(nft.created);
  }

  // ================= ERC721 interface

  function balanceOf(address _owner) public view returns (uint256) {
    return ownershipTokenCount[_owner];
  }

  function totalSupply() public view returns (uint256) {
    return allNfts.length;
  }

  function name() public pure returns (string memory) {
    return Name;
  }

  function symbol() public pure returns (string memory tokenSymbol) {  
    return Symbol;
  }

  function ownerOf(uint256 _tokenId) public view returns (address) {
    address owner = nftIndexToOwner[_tokenId];
    require(owner != address(0), "No owner of not existing address");
    return owner;
  }

  // transfer NFT to new owner
  function transfer(address _to, uint256 _tokenId) public {
    require(_to != address(0), "To address must be defined.");
    require(_to != address(this), "Cannot transfer to the contract itself");
    require(_to != msg.sender, "Cannot send to yourselves");
    require(_owns(msg.sender, _tokenId), "Cannot send token you not own");

    _transfer(msg.sender, _to, _tokenId);
  }

  // internal transfer NFT
  function _transfer(address _from, address _to, uint256 _tokenId) internal {
    // number of NFTS is capped to 2^32: can't overflow
    ownershipTokenCount[_to]++; // increment new owner count
 
    // Tx ownership
    nftIndexToOwner[_tokenId] = _to;
    if (_from != address(0)) {
      ownershipTokenCount[_from]--; // decrement old owner count
      delete nftIndexToApproved[_tokenId]; // and delete current approved addresses
    }

    // Notify..
    emit Transfer(_from, _to, _tokenId);
  }

  // check ownership
  function _owns(address _claimant, uint256 _tokenId) internal view returns (bool) {
    return nftIndexToOwner[_tokenId] == _claimant;
  }

  // ---- done for 2nd IERC721.sol.

  function approve(address _toApprove, uint256 _tokenId) public {
    require(_owns(msg.sender, _tokenId), "Sender must be owner of token Id");
    require( ! _owns(_toApprove, _tokenId), "Address already is approved");

    _approve(_tokenId, _toApprove);
    emit Approval(msg.sender, _toApprove, _tokenId);
  }
  
  function setApprovalForAll(address _toAddOperator, bool _approved) external {
    require(_toAddOperator != msg.sender, "Cannot add myself (owner) again");

    _operatorApprovals[msg.sender][_toAddOperator] = _approved;
    emit ApprovalForAll(msg.sender, _toAddOperator, _approved);
  }
  
  function getApproved(uint256 _tokenId) external view returns (address) {
    require(_tokenId < totalSupply(), "token Id must exist");

    return nftIndexToOwner[_tokenId]; // address(0) if no nfts
  }
  
  /*function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
    return _operatorApprovals[_owner][_operator]; // true if _operator is approved for _owner
  }*/

  function _approve(uint256 _tokenId, address _approved) internal {
    nftIndexToApproved[_tokenId] = _approved;
  }

  // done for 3th IERC721.sol.

  function safeTransferFrom(address _from, address _to, uint256 _tokenId) external {
    safeTransferFrom(_from, _to, _tokenId, "");
  }

  function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public {
    require( _isApprovedOrOwner(msg.sender, _from, _to, _tokenId), "Must be approved or the owner of token Id");
    _safeTransfer(_from, _to, _tokenId, _data);
  }

  function _safeTransfer(address _from, address _to, uint256 _tokenId, bytes memory _data) internal {
    _transfer(_from, _to, _tokenId);
    require( _checkERC721Support(_from, _to, _tokenId, _data) );
  }

  // Transfer from an owner to another one
  function transferFrom(address _from, address _to, uint256 _tokenId) public {
    //require(_to != address(0), "Not allowed to 0-address");
    require( _isApprovedOrOwner(msg.sender, _from, _to, _tokenId), "Must be approved or the owner of token Id");

    _transfer(_from, _to, _tokenId);
  }

  function _approvedFor(address _claimant, uint256 _tokenId) internal view returns (bool) {
    return nftIndexToApproved[_tokenId] == _claimant; // is claimant approved for token Id?
  }

  function _checkERC721Support(address _from, address _to, uint256 _tokenId, bytes memory _data) internal returns (bool) {
    if( !_isContract(_to) ) {
      return true;
    }

    // call onERC721Received in _to contract and check returned value
    bytes4 returnData = IERC721Receiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data);
    //bytes4 returnData = IERC721(_to).onERC721Received(msg.sender, _from, _tokenId, _data);
    return returnData == MAGIC_ERC721_RECEIVED;
  }

  function _isContract(address _to) internal view returns (bool) {
    uint32 size;
    assembly{
      size := extcodesize(_to) // get _to address contract size
    }
    return size > 0;
  }

  function _isApprovedOrOwner(address _spender, address _from, address _to, uint256 _tokenId) internal view returns (bool) {
    require(_to != address(0), "Cannot transfer to zero address");
    require(_owns(_from, _tokenId), "Must be owner the token Id");
    require(_tokenId < totalSupply(), "token Id must exist");

    // spender is from || spender is approved for token Id || spender is operator for from
    return (_spender == _from
          || _approvedFor(_spender, _tokenId)
          /*|| isApprovedForAll( _from, _spender)*/ );
  }

  // ============

  function _deleteApproval(uint256 _tokenId) internal {
      require(_owns(msg.sender, _tokenId));
      delete nftIndexToApproved[_tokenId];
  }
  
  function tokensOfOwner(address _owner) public view returns(uint256[] memory ownerTokens) {
    uint256 tokenCount = balanceOf(_owner);

    if (tokenCount == 0) {
        return new uint256[](0);
    } else {
        uint256[] memory result = new uint256[](tokenCount);
        uint256 totalNfts = totalSupply();
        uint256 resultIndex = 0;

        uint256 nftId;

        for (nftId = 1; nftId <= totalNfts; nftId++) {
            if (nftIndexToOwner[nftId] == _owner) {
                result[resultIndex] = nftId;
                resultIndex++;
            }
        }

        return result;
    }
  }
  
  // ==== Marketplace
  /**
  * Get the details about an offer for _tokenId.
  * No longer: Throws an error if there is no active offer for _tokenId.
  */
  function getOffer(uint256 _tokenId) public view returns ( address seller, uint256 priceWEI, uint256 index, uint256 tokenId, bool active) {
    Offer memory offer = tokenIdToOffer[_tokenId];
    seller  = offer.seller;
    priceWEI   = offer.priceWEI;
    index   = offer.index;
    tokenId = offer.tokenId;
    active  = offer.active;
  }

  /**
  * Get all tokenId's that are currently for sale.
  * Returns an empty arror if none exist.
  */
  function getAllTokenOnSale() public view returns(uint256[] memory) {
    uint256 totalOffers = allOffers.length;

    if (totalOffers == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory _listOfOffers = new uint256[](totalOffers);
      uint256 id = 0;
      for(uint256 i=0; i<totalOffers; i++) {
        if (allOffers[i].active == true) { // check for priceWEI > 0 ??
          _listOfOffers[ id++ ] = allOffers[i].tokenId;
        }
      }
      return _listOfOffers;
    }
  }

  /**
  * Creates a new offer for _tokenId for the _priceWEI.
  * Emits the MarketTransaction event with txType "Create offer"
  * Requirement: Only the owner of _tokenId can create an offer.
  * Requirement: There can only be one active offer for a token at a time.
  * Requirement: Marketplace contract (this) needs to be an approved operator when the offer is created.
  */
  function setOffer(uint256 _priceWEI, uint256 _tokenId) public {
    require(_ownsNft(msg.sender, _tokenId), "Seller does not own this token Id"); // ?
    require(tokenIdToOffer[_tokenId].active == false, "Token Id has already an offer");
    // ?
    //require(isApprovedForAll(msg.sender, address(this)), "Marketplace contract is not yet an approved operator to transfer later");

    approve(address(this), _tokenId);

    Offer memory offer = Offer({
      seller: msg.sender,
      priceWEI: _priceWEI,
      index: allOffers.length,
      tokenId: _tokenId,
      active: true
    });
    allOffers.push(offer);
    tokenIdToOffer[_tokenId] = offer;

    emit MarketTransaction("Create offer", msg.sender, _tokenId, _priceWEI);
  }

  /**
  * Removes an existing offer.
  * Emits the MarketTransaction event with txType "Remove offer"
  * Requirement: Only the seller of _tokenId can remove an offer.
    */
  function removeOffer(uint256 _tokenId) public {
    require(_owns(msg.sender, _tokenId), "Only seller can remove token Id");

    Offer memory offer = tokenIdToOffer[_tokenId];
    require(offer.active == true, "There is no active order to remove for token Id");
    require(offer.seller == msg.sender, "You should be own the nft to be able to remove this offer");

    /* we set the offer to inactive */
    allOffers[offer.index].active = false;

    /* Remove the offer in the mapping*/
    delete tokenIdToOffer[_tokenId];

    _deleteApproval(_tokenId); // .

    emit MarketTransaction("Remove offer", msg.sender, _tokenId, offer.priceWEI);
  }

  /**
  * Executes the purchase of _tokenId.
  * Sends the funds to the seller and transfers the token using transferFrom in Nftcontract.
  * Emits the MarketTransaction event with txType "Buy".
  * Requirement: The msg.value needs to equal the priceWEI of _tokenId
  * Requirement: There must be an active offer for _tokenId
  */
  function buyNft(uint256 _tokenId) public payable {
    Offer memory offer = tokenIdToOffer[_tokenId];
    require(offer.active == true, "The offer is not active for token Id");
    require(msg.value == offer.priceWEI, "The price in WEI is not correct");

    /* Remove the offer in the mapping*/
    delete tokenIdToOffer[_tokenId];

    /* set the offer to inactive */
    allOffers[offer.index].active = false;

    _approve(_tokenId, msg.sender); // .

    // transfer ownership
    transferFrom(offer.seller, msg.sender, _tokenId);

    // Transfer funds to the seller (ToDo: make this logic pull instead of push)
    if (offer.priceWEI > 0) {
      offer.seller.transfer(offer.priceWEI / 1 ether); // to ether amount
    }

    emit MarketTransaction("Buy", msg.sender, _tokenId, offer.priceWEI);
  }

  function _ownsNft(address _address, uint256 _tokenId) internal view returns (bool) {
    return (ownerOf(_tokenId) == _address);
  }
}