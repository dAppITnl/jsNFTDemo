//Append each Nft card as a catalog
function showCatalogNft(id, metadata, created) {
  let createdDT = '?'
  if (created) {
    const d = new Date(created*1000)
    createdDT = d.toLocaleString()
  }
  nftCard(id, metadata, createdDT)
  $('#nftcard' + id).attr('onclick', 'go_to("nftDetails.html?nftId=' + id + '")')
}

//Nft HTML Div for catalog
function nftCard(id, metadata, createdDT) {
  var nftDiv = `<div class="col-auto mb-3">`
              +`<div class="card" style="cursor: pointer;width: 18rem;" id="nftcard`+id+`">`
              +`  <div class="card-header"><img class="nftImgCatalog" src="`+metadata.image+`"></div>`
              +`  <div class="card-body"><h3>`+id+`: `+metadata.name+`</h3>`
              +`    Brand: <b>`+metadata.data.Brand+`</b><br>`
              +`    At: `+ createdDT
              +`  </div>`
              +`</div>`
              +`</div>`
  console.log('nftDiv=' + nftDiv)
  var nftCard = $('#nftcard' + id)
  if (!nftCard.length) {
      $('#nftsDiv').append(nftDiv)
  }
}

async function showDetailNft(id, metadata, created) {
  console.log('showDetailNft id=' + id)
  console.log('showDetailNft metadata', metadata)
  console.log('showDetailNft created=' + created)
  let createdDT = '?'
  if (created) {
    const d = new Date(created*1000)
    createdDT = d.toLocaleString()
  }
  var nftDetails = `<div class="card">`
                  +`  <div class="card-header"><img src="`+metadata.image+`"></div>`
                  +`  <div class="card-body"><h2>`+id+`: `+metadata.name+`</h2>`
                  +`    <p><table border="0">`
                  +`      <tr><td>Size: </td><td>`+metadata.data.Size+`</td></tr>`
                  +`      <tr><td>Style code: </td><td>`+metadata.data.Stylecode+`</td></tr>`
                  +`      <tr><td>Brand: </td><td>`+metadata.data.Brand+`</td></tr>`
                  +`      <tr><td>Model: </td><td>`+metadata.data.Model+`</td></tr>`
                  +`      <tr><td>Release date: </td><td>`+metadata.data.Releasedate+`</td></tr>`
                  +`      <tr><td>Description: </td><td>`+metadata.data.Description+`</td></tr>`
                  +`      <tr><td>Created: </td><td>`+createdDT+`</td></tr>`
                  +`    </table></p>`
                  +`  </div>`
                  +`</div>`
  $('#nftDetails').html(nftDetails)

  await nftOffer(id)
}

// Checks the NFT on market situation
async function nftOffer(id) {
  console.log('nftOffer id='+id)
  var offer = await checkOffer(id)
  console.log('nftOffer offer: ', offer)
  if (offer.error) {
    $('#error').html('Error: ' + offer.error)
  } else {
    var seller = offer.seller.toLocaleLowerCase()
    if ((offer.onsale == true) && (seller.toLowerCase() != userAccount.toLowerCase())) {
        const priceETH = web3.utils.fromWei(offer.priceWEI, 'ether')
        const priceEUR = await getEthToEuro(priceETH)
        $('#buyBox').removeClass('hidden')
        $('#priceBtn').html('<b>' + priceETH + ' ETH</b>')
        $('#buyBtn').attr('onclick', 'buyNft(' + id + ',"' + offer.priceWEI + '")')
        $('#buyBtnPriceEuro').html(' &euro; '+priceEUR)
        $('#buyBoxDetails').html('Seller: '+seller)
    }
    
    var ownership = await nftOwnership(id)
    //If userAccount owns the NFT
    if (ownership == true) {        
        //If is not on sale
        if (offer.onsale == false) {
            $('#sellBox').removeClass('hidden')
            $('#sellBtn').attr('onclick', 'sellNft(' + id + ')')
        } else {
            $('#sellBox').removeClass('hidden')
            $('#cancelBox').removeClass('hidden')
            $('#cancelBtn').attr('onclick', 'deleteOffer(' + id + ')')
            $('#sellBtn').addClass('btn-success')
            $('#sellBtn').html('<b>For sale at:</b>')
            $('#sellPrice').val(web3.utils.fromWei(offer.priceWEI, 'ether'))
            $('#sellPrice').prop('readonly', true)
            sellPriceChanged()
        }
    }
  }
}
