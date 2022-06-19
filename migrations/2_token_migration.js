const Nftcontract = artifacts.require("Nftcontract");

module.exports = function (deployer) {
  deployer.deploy(Nftcontract);
};
