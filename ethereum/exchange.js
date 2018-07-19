// import web3 from './web3';
// import HouseholdFactory from './build/HouseholdFactory.json';
// const ganache = require('ganache-cli');
// const Web3 = require('web3');
// const web3 = new Web3(ganache.provider());

const web3 =require('./web3-ganache');
const Exchange = require ('./build/Exchange.json');

//replace this address with the deployed version of batteryfactory
const instance = new web3.eth.Contract(
    JSON.parse(Exchange.interface),
    '0xf87f0C86Dc64cB5e869CF08f0c0Ca240CFaC5A36'
);

// export default instance;
module.exports = instance;