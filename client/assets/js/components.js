function menu() {
  var menu = `<nav class="menu navbar navbar-expand-md navbar-light fixed-top bg-ligh p-4">
    <div class="container">
        <a class="navbar-brand" href="index.html"><img src="./assets/images/jsNFTDemo.png" alt="javascript-NFT-Demo logo" title="javascript-NFT-Demo logo"></a>
        <button class="navbar-toggler collapsed" type="button" data-toggle="collapse"
            data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false"
            aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="navbar-collapse collapse  justify-content-end" id="navbarsExampleDefault">

            <div align="right">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.html"><b>Home</b></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="catalog.html"><b>Catalog</b></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="myNfts.html"><b>My NFTs</b></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="factory.html"><b>Create NFT</b></a>
                    </li>
                    <li class="nav-item">
                        <button id="connectMetaMaskBtn" class="btn red-btn ml-2">connect MetaMask</button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    </nav>`
    $('#menu').html(menu)
    console.log('menu created')
}
menu()

function footer() {
    const footer = `<table border="0" width="100%"><tr>
    <td align="right"><small>
        My address: <b><span id="userAccount"></span></b><br>
        Contract address: <b><span id="nftContractAddress"></span></b><br>
        Network: <b><span id="chainTitle"></span></b>
    </small></td>
    <td align="right">&copy; 2022 Demo App<br /><a href="https://dAppIT.nl" target="_blank">DAppIT</a> / <a href="https://Moralis.io" target="_blank">Moralis</a></td>
  </tr></table>`
  $('#footer').html(footer)
  console.log('footer created')
}
footer()
