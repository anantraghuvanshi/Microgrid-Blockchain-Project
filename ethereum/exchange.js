//Using infura, uncomment lines under ganache method for it to work
//const web3 = require('./web3.js');

//Using ganache
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"));
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of exchange
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0xFb0a4349e7c2CF460DAe6622788e3D534283D3D7'
);

// export default instance;
module.exports = instance;