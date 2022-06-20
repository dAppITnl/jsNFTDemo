var userMoralis
var chainIdDec = 0
var chainTitle = ''
var TXExplorerUrl = ''
var web3 = null

Moralis.start({ serverUrl, appId })
console.log('Moralis started: ', Moralis)

var instance
var userAccount
var nftContractAddress
var contractOwner

$(document).ready( async function(){
  $('#connectMetaMaskBtn').click(connectMetaMask)
  connectMetaMask()
})

async function connectMetaMask() {
  const connectBtn = $('#connectMetaMaskBtn')
  if (connectBtn.text().startsWith('Dis')) {
    console.log('disconnectMetaMask start..')
  
    await Moralis.User.logOut().then(() => {
      console.log('User disconnected from MetaMask!')
      connectBtn.text('connect MetaMask')
      web3 = null
      userAccount = 'unknown'
      $('#userAccount').text(userAccount)
    })
  } else {
    doConnectMetaMask()
  }
}

async function doConnectMetaMask() {
  userMoralis = Moralis.User.current();
  console.log('connectMetaMask userMoralis: ', userMoralis)
  if (!userMoralis) {
    userMoralis = await Moralis.authenticate({
      signingMessage: 'Log in NFT demo'
    }).then((user) => {
      userAccount = user.get("ethAddress")
      console.log('connected MetaMask user: ', user)
      console.log('connected MetaMask user ethaddress=' + userAccount)
      $('#userAccount').text(userAccount)
      postConnect()
    }).catch((error) => {
      $('#connectMetaMaskBtn').text('Connect MetaMask')
      userAccount = 'unknown';
      $('#userAccount').text(userAccount)
      const msg = 'connect MetaMask error: ' + error.code + '=' + error.message
      console.log(msg)
      alert(msg)
    })
  } else {
    userAccount = userMoralis.get("ethAddress")
    console.log('User already connected to MetaMask as ' + userAccount, userMoralis)
    $('#userAccount').text(userAccount)
    postConnect()
  }  
}

async function postConnect() {
  try {
    const ethereum = window.ethereum
    if (ethereum && ethereum.on) {
      if (web3 == null) {
        web3 = new Web3(ethereum)
        console.log('web3: ', web3)
      }

      chainIdDec = await web3.eth.net.getId() // chain of metamax
      //chainIdDec = await Moralis.getChainId()
      console.log('chainIdDec=' + chainIdDec)

      TXExplorerUrl = await getBlockExplorerUrl(chainIdDec)
      console.log('TXExplorerUrl=' + TXExplorerUrl)

      chainTitle = await getChainTitle(chainIdDec)
      chainTitle = chainIdDec +' = '+ chainTitle
      console.log('chainTitle=' + chainTitle)
      $('#chainTitle').text(chainTitle)

      nftContractAddress = await getNftContractAddress(chainIdDec)
      console.log('nftContractAddress=' + nftContractAddress)
      $('#nftContractAddress').text(nftContractAddress)

      if (nftContractAddress != '' && userAccount != '' && userAccount != 'unknown') {
        console.log('nftContractAddress='+nftContractAddress + ' userAccount='+userAccount)
        instance = new web3.eth.Contract(abi, nftContractAddress, {from: userAccount})
        console.log('instance: ', instance)
      }

      /*     
        Events listener for NFT created:
          Listen for the NFTcreated event, and update the UI
          This event is generated in the NFTcontract
          when the _createNft internal method is called
      */
      if (instance) {
        instance.events.NftCreated({}, (error, event) => {
          if (error) {
            var msg = 'Event NftCreated error: ' + error;
            console.log(msg);
            alert(msg);
          } else {
            console.log('Event NftCreated: ', event);
            var created = parseInt(event.returnValues.created);
            var createdTimeDT = 'unknown';
            if (created != NaN) {
              var createdDate = new Date( created * 1000);
              var createdDT = createdDate.toGMTString() + " = " + createdDate.toLocaleString();
            }
            var msg = "A new Nft has been created!"
              + "\nAt: " + createdDT
              + "\nOwner: " + event.returnValues.owner
              + "\nMetadataUrl: " + event.returnValues.metadataUrl
              + "\nNftId: " + event.returnValues.nftId;
            $('#resultNft').html("<textarea readonly cols='32' rows='5' wrap='off'>" + msg + "</textarea>");
          }
        });

        instance.events.ApprovalForAll({}, (error, event) => {
          if (error) {
            var msg = 'ApprovalForAll error: ' + error
            console.log(msg)
            alert(msg)
          } else {
            console.log('ApprovalForAll event: ', event)
            const owner = event.returnValues["owner"]
            const operator = event.returnValues["operator"]
            const approved = event.returnValues["approved"].toString()
            const msg = 'Approved for all: owner='+owner+' operator='+operator+' as '+approved
            console.log(msg)
            alert_msg(msg)
          }
        })

        instance.events.MarketTransaction({}, (error, event) => {
          if (error) {
            var msg = 'Market transaction error: ' + error
            console.log(msg)
            alert(msg)
          } else {
            console.log('Market transaction event: ', event)
            const eventType = event.returnValues["TxType"].toString()
            const tokenId = event.returnValues["tokenId"]
            const priceWEI = event.returnValues["priceWEI"]
            console.log('Event MarketTransaction: type='+eventType+' tokenId='+tokenId+' priceWEI='+priceWEI)
            switch (eventType) {
              case "Buy":
                alert_msg('Succesfully Nft purchase! Now you own this Nft with TokenId: ' + tokenId, 'success')
                break
              case "Create offer":
                alert_msg('Successfully Offer created for Nft id: ' + tokenId, 'success')
                $('#cancelBox').removeClass('hidden')
                $('#cancelBtn').attr('onclick', 'deleteOffer(' + tokenId + ')')
                $('#sellBtn').attr('onclick', '')
                $('#sellBtn').addClass('btn-warning')
                $('#sellBtn').addClass('disabled')
                $('#sellBtn').html('<b>For sale at:</b>')
                $('#sellPrice').val(web3.utils.fromWei(priceWEI, 'ether'))
                $('#sellPrice').prop('readonly', true)
                sellPriceChanged()
                break
              case "Remove offer":
                alert_msg('Successfully Offer remove for Nft id: ' + tokenId, 'success')
                $('#cancelBox').addClass('hidden')
                $('#cancelBtn').attr('onclick', '')
                $('#sellPrice').val('')
                $('#sellPrice').prop('readonly', false)
                sellPriceChanged()
                $('#sellBtn').removeClass('btn-warning')
                $('#sellBtn').removeClass('disabled')
                $('#sellBtn').addClass('btn-success')
                $('#sellBtn').html('<b>Sell me</b>')
                $('#sellBtn').attr('onclick', 'sellNft(' + tokenId + ')')
                break
            }
          }
        });
      }

      $('#connectMetaMaskBtn').text('Disconnect MetaMask')

      console.log('action=' + action)
      switch (action) {
        case 'myNfts':    myNfts(); break;
        case 'detailNft': detailNft(); break;
        case 'catalog':   catalog(); break;
      }
    } else {
      const msg = 'This app requires MetaMask, please install MetaMask browser plugin'
      console.log(msg)
      alert(msg)
    }
  } catch(error){
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('document ready ', msg)
    alert(msg)
  }
};

// ============= factory.html: Add a NFT (Item)

async function getImageFromIPFS() {
  try {
    const imageFileIpfsHash = $('#inputImageIPFSHash').val()
    console.log('getImageFromIPFS imageHash=' + imageFileIpfsHash)
    const imageFileIpfsUrl = IPFSUrl + imageFileIpfsHash
    console.log('getImageFromIPFS imageIpfsUrl=' + imageFileIpfsUrl);
    $('#resultImageHash').html(imageFileIpfsHash != '' ? '<a href="'+imageFileIpfsUrl+'" target="_blank">' + shortenString(imageFileIpfsHash, 8) + '</a>' : '?')
    $('#inputImage').html(imageFileIpfsHash != '' ? '<img src="'+imageFileIpfsUrl+'" class="inputImage">' : '')
  } catch(error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('getImageFromIPFS ' + msg)
    alert(msg)
  }
}
$('#getImageFromIPFS').click(getImageFromIPFS)

async function saveImageToIPFS() {
  try {
    $('#saveImageToIPFSResult').text('Start saving...')
    var imageFile = $('#inputImagefile')[0].files[0];
    console.log('saveImageToIPFS saveImageToIPFS: file:', imageFile)
    console.log('saveImageToIPFS saveImageToIPFS: file.name:', imageFile.name)

    const file = new Moralis.File(imageFile.name, imageFile);
    await file.saveIPFS();
    imageFileIpfsUrl = file.ipfs();
    imageFileIpfsHash = file.hash();
    $('#inputImageIPFSHash').val(imageFileIpfsHash)
    getImageFromIPFS()
    $('#saveImageToIPFSResult').text('Saving successfull!')
  } catch(error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('saveImageToIPFS ' + msg)
    $('#saveImageToIPFSResult').text(msg)
  }
}
$('#saveImageToIPFS').click(saveImageToIPFS)

function addInputItemToArray(arr, item) {
  let str = $('#input'+item).val()
  if (str != '') {
    arr[item] = str
  }
  return arr
}

function setInputItemsFromArray(arr) {
  console.log('setInputItemsFromArray arr:', arr)
  for(let item in arr) {
    $('#input'+item).val(arr[item])
  }
}

function shortenString( str, n) {
  let res = str
  if (str.length > 2*n) {
    res = str.substr(0,n) + '...' + str.substr(str.length-n)
  }
  return res
}

async function fetchUrlData(url) {
  try {
    console.log('fetchUrlData url=' + url)
    const response = await fetch(url /*, {
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin':'http://localhost:8000'
      }
    }*/)
    const json = await response.json()
    console.log('fetchUrlData json: ', json)
    return json
  } catch(err) {
    const msg = 'ERROR: ' + err
    console.log('fetchUrlData ' + msg)
    alert(msg)
  }
}

async function getMetadataFromIPFS() {
  try {
    const metadataIpfsHash = $('#inputMetadataIPFSHash').val()
    console.log('getMetadataFromIPFS metadataHash=' + metadataIpfsHash)
    if (metadataIpfsHash != '') {
      metadataIpfsUrl = IPFSUrl + metadataIpfsHash
      console.log('getMetadataFromIPFS metadataIpfsUrl=' + metadataIpfsUrl)
      $('#resultMetadataHash').html(metadataIpfsHash != '' ? '<a href="'+metadataIpfsUrl+'" target="_blank">' + shortenString(metadataIpfsHash, 8) + '</a>' : '?')
      metadata = await fetchUrlData(metadataIpfsUrl)
      console.log('getMetadataFromIPFS fetched metadata:', metadata)
      if (metadata.name) $('#inputName').val(metadata.name)
      setInputItemsFromArray(metadata.data)
      if (metadata.image) {
        let imageFileIpfsUrl = metadata.image
        let hashStart = imageFileIpfsUrl.lastIndexOf('/')
        if (hashStart > 0) {
          imageFileIpfsHash = imageFileIpfsUrl.substr(hashStart+1)
          $('#inputImageIPFSHash').val(imageFileIpfsHash)
          console.log('getMetadataFromIPFS fetched imageHash=' + imageFileIpfsHash)
          getImageFromIPFS(imageFileIpfsUrl)
        }
      }
    }
  } catch(error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('getMetadataFromIPFS ' + msg)
    alert(msg)
  }
}
$('#getMetadataFromIPFS').click(getMetadataFromIPFS)

async function saveMetadataToIPFS() {
  try {
    $('#saveMetadataToIPFSResult').text('Start saving metadata...')
    const imageFileIpfsHash = $('#inputImageIPFSHash').val()
    console.log('saveMetadataToIPFS imageHash=' + imageFileIpfsHash)
    if (imageFileIpfsHash == '') {
      $('#saveMetadataToIPFSResult').text('First add an image...')
      alert('Image Hash is empty: first add an image to IPFS');
    } else {
      const inputName = $('#inputName').val()
      if (imageFileIpfsHash != '' && inputName != '') {
        var data = {}
        data = addInputItemToArray(data, 'Size')
        data = addInputItemToArray(data, 'Stylecode')
        data = addInputItemToArray(data, 'Brand')
        data = addInputItemToArray(data, 'Model')
        data = addInputItemToArray(data, 'Releasedate')
        data = addInputItemToArray(data, 'Description')
        console.log('saveMetadataToIPFS data=', data)
        console.log('saveMetadataToIPFS JSON data=', JSON.stringify(data))
        metadata = JSON.stringify({
          name: inputName,
          data: JSON.parse( JSON.stringify(data) ),
          image: IPFSUrl + imageFileIpfsHash
        })
        console.log('metadata=' + metadata)
        const metadataJson = new Moralis.File("metadata.json", {base64: btoa(metadata)})
        await metadataJson.saveIPFS()
        metadataIpfsUrl = metadataJson.ipfs()
        metadataIpfsHash = metadataJson.hash()
        $('#inputMetadataIPFSHash').val(metadataIpfsHash)
        getMetadataFromIPFS()
        $('#saveMetadataToIPFSResult').text('Saving metadata successfull')
      }
    }
  } catch(error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('saveMetadataToIPFS' + msg)
    //alert(msg)
    $('#saveMetadataToIPFSResult').text(msg)
  }
}
$('#saveMetadataToIPFS').click(saveMetadataToIPFS)

async function getEthToEuro(price) {
  const ethPrice = Number(price)
  console.log('ethToEuro ethPrice=' + price + '=' + ethPrice)
  var euroPrice = 0
  if (ethPrice != 0) {
    const url = 'https://api.binance.com/api/v3/ticker/price?symbol=ETHEUR'
    priceData = await fetchUrlData(url)
    console.log('ethToEuro price: ' + priceData.price +'='+ Number(priceData.price))
    eurPrice = Number(ethPrice) * Number(priceData.price)
  }
  return (Math.round(eurPrice*100) / 100).toFixed(2)
}

var prevInitPrice = ''
$('#inputInitPrice').change(async () => {
  const price = $('#inputInitPrice').val()
  console.log('inputInitPrice price=', price)
  if (prevInitPrice != price) {
    prevInitPrice = price
    const euroPrice = await getEthToEuro(price)
    $('#initPriceEuro').html(' &euro; ' + euroPrice)
  }
})

var prevSellPrice
async function sellPriceChanged() {
  const price = $('#sellPrice').val()
  console.log('sellPrice price=', price)
  if (prevSellPrice != price) {
    prevSellPrice = price
    const euroPrice = await getEthToEuro(price)
    $('#sellBtnPriceEuro').html(' &euro; ' + euroPrice)
  }
}
$('#sellPrice').change(sellPriceChanged)

async function saveMetadataHashToChain() {
  try {
    $('#saveMetadataHashToChainResult').text('Start save to chain...')
    const metadataIpfsHash = $('#inputMetadataIPFSHash').val()
    const initPrice = $('#inputInitPrice').val()
    const initPriceWEI = await web3.utils.toWei(initPrice, 'ether');
    console.log('saveMetadataHashToChain hash='+metadataIpfsHash+' initPrice='+initPrice+' => '+initPriceWEI+' WEI')
    if (metadataIpfsHash == '' && chainIdDec != 0 && initPrice >= 0.0001) {
      $('#saveMetadataHashToChainResult').text('Unknown chain or first add metadata to IPFS...')
      alert('Metadata Hash is empty: first add metadata to IPFS or Chain not known')
    } else {
      if (instance) {
        metadataIpfsUrl = IPFSUrl + metadataIpfsHash
        console.log('saveMetadataHashToChain chainIdDec=' + chainIdDec)
        console.log('saveMetadataHashToChain metadataIpfsUrl=' + metadataIpfsUrl)
        console.log('saveMetadataHashToChain initPriceWEI=' + initPriceWEI)
        instance.methods.createNft(metadataIpfsUrl, initPriceWEI).send({}, function(error, txHash) {
          if (error) {
            const msg = 'Create new NFT error: user rejected or sender is not the contract owner ('+error.message+')'
            console.log(msg);
            //alert(msg);
            $('#saveMetadataHashToChainResult').text('Error save: ' + error.message)
          } else {
            console.log('NFT created! txHash=' + txHash);
            let txUrl = TXExplorerUrl + '/tx/' + txHash;
            $('#resultChainHash').html(txHash != '' ? '<a href="'+txUrl+'" target="_blank">' + shortenString(txHash, 8) + '</a>' : '?')
            $('#saveMetadataHashToChainResult').text('Save to chain successfull')
          }        
        })
      } else {
        $('#saveMetadataHashToChainResult').text('Error: wallet instance unknown, (re-)connect MetaMask?')
      }
    }
  } catch(error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('saveMetadataHashToChain ' + msg)
    $('#saveMetadataHashToChainResult').text(msg)
  }
}
$('#saveMetadataHashToChain').click(saveMetadataHashToChain)

// =====================

async function checkOffer(id) {
  let res
  var offer = {}
  try {
    console.log('checkOffer id=' + id)
    res = await instance.methods.getOffer(id).call();
    console.log('checkOffer: res=', res)
    offer = {
      seller: res['seller'],
      priceWEI: res['priceWEI'],
      onsale: res['active'],
      index: res['index'],
      tokenId: res['tokenId']
    }
    //const approve = await instance.methods.approve()
    /*var seller = 
    var index = res['index']
    var onsale = false
    //If price more than 0 means that cat is for sale
    if (price > 0) {
      onsale = true
    }
    //Also might check that belong to someone
    var offer = { seller: seller, price: price, onsale: onsale }
    //return offer
    */
  } catch (error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('checkOffer ' + msg)
    alert(msg)
    //return //{seller:'!error!', price:0, onsale:false}
  }
  return offer
}

// Get all the nfts from address
async function nftByOwner(address) {
  let res;
  try {
    res = await instance.methods.tokensOfOwner(address).call();
  } catch (error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('nftByOwner ' + msg)
    alert(msg)
  }
}

//Gen 0 nfts for sale
async function catalog() {
  try {
    var arrayId = await instance.methods.getAllTokenOnSale().call();
    console.log('catalog arrayId: ', arrayId)
    for (i = 0; i < arrayId.length; i++) {
      if(arrayId[i] != "0"){
        await appendNft(arrayId[i])
      }    
    }
  } catch(error) {
    const msg = 'ERROR: ' + error.code +'='+ error.message
    console.log('catalog ' + msg)
    alert(msg)
  }
}

//Get nfts of a current address
async function myNfts() {
  console.log('myNfts useraccount=' + userAccount)
  var arrayId = await instance.methods.tokensOfOwner(userAccount).call()
  console.log('myNfts arrayId: ', arrayId)
  for (i = 0; i < arrayId.length; i++) {
    appendNft(arrayId[i])
  }
}

//Get nfts for breeding that are not selected
/*async function breedNft(gender) {
  var arrayId = await instance.methods.tokensOfOwner(userAccount).call();
  for (i = 0; i < arrayId.length; i++) {
    appendBreed(arrayId[i], gender)
  }
}*/

// Checks that the user address is same as the NFT owner address
//This is use for checking if user can sell this NFT
async function nftOwnership(id) {
  var address = await instance.methods.ownerOf(id).call()

  if (address.toLowerCase() == userAccount.toLowerCase()) {      
    return true
  }  
  return false
}


//Appending NFTs for catalog
async function appendNft(id) {
  console.log('appendNft id=' + id)
  var nft = await instance.methods.getNft(id).call()
  console.log('appendNft nft: ', nft)
  if (nft.created > 0 && nft.metadataUrl != '') {
    let nftMetadata = await fetchUrlData(nft.metadataUrl);
    console.log('appendNft nftMetadata: ', nftMetadata)
    showCatalogNft(id, nftMetadata, nft.created)
  }
}


async function detailNft() {
  var id = get_variables().nftId
  console.log('detailNft id=' + id)
  var nft = await instance.methods.getNft(id).call()
  console.log('detailNft nft: ', nft)
  if (nft.created > 0 && nft.metadataUrl != '') {
    let nftMetadata = await fetchUrlData(nft.metadataUrl);
    console.log('detailNft nftMetadata: ', nftMetadata)
    showDetailNft(id, nftMetadata, nft.created)
  }
}

async function deleteOffer(id) {
  try {
    console.log('deleteOffer id=' + id)
    await instance.methods.removeOffer(id).send();    
  } catch (error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('deleteOffer ' + msg);
    alert(msg)
  }
}

async function sellNft(id) {  
  console.log('sellNft id=' + id)
  var price = $('#sellPrice').val()
  var amount = web3.utils.toWei(price, "ether")
  console.log('sellNft price=' + price + ' amount=' + amount)
  try {
    console.log('sellNft setApprovalForAll for userAccount')
    await instance.methods.setApprovalForAll(userAccount, true)
    console.log('sellNft setOffer for price='+price+' id='+id)
    await instance.methods.setOffer(amount,id).send();
  } catch (error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('sellNft ' + msg);
    alert(msg)
  }
}

async function buyNft(id, priceWei) {
  console.log('buyNft id='+id+' priceWei='+priceWei)
  //var amount = price //web3.utils.toWei(price, "ether")
  try {
    await instance.methods.buyNft(id).send({ value: priceWei });
  } catch (error) {
    const msg = 'ERROR: ' + error.code + '=' + error.message
    console.log('buyNft ', msg)
    alert(msg)
  }
}

async function totalNfts() {
  var nfts = await instance.methods.totalSupply().call();
}
