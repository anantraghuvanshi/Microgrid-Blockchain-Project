const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
//const web3 = new Web3(ganache.provider());
const web3 = new Web3( new Web3.providers.HttpProvider("http://localhost:8545"))
//const web3 = require('../ethereum/web3-ganache.js');


const compiledFactory = require('../ethereum/build/HouseholdFactory.json');
const compiledCampaign = require('../ethereum/build/Household.json');
const compiledExchange = require('../ethereum/build/Exchange.json');


let accounts;
let factory;
let householdAddress;
let household;
let exchange;
let date;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

    exchange = await new web3.eth.Contract(JSON.parse(compiledExchange.interface))
        .deploy({ data: compiledExchange.bytecode })
        .send({ from: accounts[0], gas: '1999999' });

    await factory.methods.createHousehold('5000').send({
        from: accounts[0],
        gas: '1000000'
    });
    await factory.methods.createHousehold('4000').send({
        from: accounts[1],
        gas: '1000000'
    });
    await factory.methods.createHousehold('3000').send({
        from: accounts[2],
        gas: '1000000'
    });

    households = await factory.methods.getDeployedHouseholds().call(); //the square brackets is a deconstructing array thing, which extract the first element of the array to assign it to campaignAddress
    household1 = await new web3.eth.Contract(
        JSON.parse(compiledCampaign.interface),
        households[0]
    );
    household2 = await new web3.eth.Contract(
        JSON.parse(compiledCampaign.interface),
        households[1]
    );
    household3 = await new web3.eth.Contract(
        JSON.parse(compiledCampaign.interface),
        households[2]
    );
    //Deposit some money so they can operate
    await household1.methods.deposit().send({
        from: accounts[0],
        gas: '1000000',
        value: web3.utils.toWei( '1', 'ether')
        });
    await household2.methods.deposit().send({
        from: accounts[1],
        gas: '1000000',
        value: web3.utils.toWei( '1', 'ether')
    });
    await household3.methods.deposit().send({
        from: accounts[2],
        gas: '1000000',
        value: web3.utils.toWei( '1', 'ether')
    });
    
});

describe('Households', () => {

    it('deploys a factory, a household and an exchange', () =>{
        assert.ok(factory.options.address),
        assert.ok(exchange.options.address),
        assert.ok(household1.options.address),
        assert.ok(household2.options.address)
    });

    it('marks caller as the household manager', async () => {
        const owner = await household1.methods.owner().call();
        const contractAddress= await household1.methods.contractAddress().call();
        const balance = await household1.methods.balanceContract().call();
        assert.equal(accounts[0], owner);

    });

    it('deposits some ether and charge created households', async () => {
        let BalanceAccount=await web3.eth.getBalance(accounts[0]);
        console.log('balance account', BalanceAccount);
        await household1.methods.deposit().send({
        from: accounts[0],
        gas: '1000000',
        value: web3.utils.toWei( '1', 'ether')
        });
        
        await household2.methods.deposit().send({
        from: accounts[1],
        gas: '1000000',
        value: web3.utils.toWei( '1', 'ether')
        });

        await household1.methods.charge(5000).send({
            from: accounts[0],
            gas: '1000000'
            });
        await household2.methods.charge(4000).send({
            from: accounts[1],
            gas: '1000000'
            });

        balance1 = await web3.eth.getBalance(household1.options.address);
        balance2 = await web3.eth.getBalance(household2.options.address);

        assert(balance1, web3.utils.toWei('1', 'ether'));
        assert(balance2, web3.utils.toWei('1', 'ether'));

        charge1 = await household1.methods.amountOfCharge().call();
        charge2 = await household2.methods.amountOfCharge().call();

        assert(charge1, 5000);
        assert(charge2, 4000);
    });

    


    it('can make a transaction between 2 household contracts',async () =>{
        addressExchange = exchange.options.address;
        
        //set the exchange address necessary to interact with it
        await household1.methods.setExchange(addressExchange).send({
            from: accounts[0],
            gas: '1000000'
        });
        await household2.methods.setExchange(addressExchange).send({
            from: accounts[1],
            gas: '1000000'
        });
        await exchange.methods.deposit().send({
            from:accounts[2],
            gas: '1000000',
            value:  web3.utils.toWei( '1', 'ether')
        });
        
        
        const check1 = await household1.methods.exchangeAddress().call();
        const check2 = await household2.methods.exchangeAddress().call();

        //check for correct address
        assert.equal(addressExchange, check1 );
        assert.equal(addressExchange, check2 );


        pre_balance1 = await web3.eth.getBalance(household1.options.address);
        pre_balance2 = await web3.eth.getBalance(household2.options.address);
        balanceEx = await web3.eth.getBalance(exchange.options.address);
        
        // console.log('balance of exchange contract', balanceEx);        
        // console.log('balance1', pre_balance1);
        // console.log('balance2', pre_balance2);

        
        confirmation1= await household1.methods.buyEnergy(2000, household2.options.address, 10).send({
            from: accounts[0],
            gas: '1999999'
        });

        confirmation2= await household1.methods.buyEnergy(2000, household2.options.address, 10).send({
            from: accounts[0],
            gas: '1999999'
        });

        balance1 = await web3.eth.getBalance(household1.options.address);
        balance2 = await web3.eth.getBalance(household2.options.address);
        amountOfCharge = await household2.methods.amountOfCharge().call();
       
        //checking for balance post transaction
        console.log(amountOfCharge);
        console.log('balance1', balance1);
        console.log('balance2', balance2);
        //console.log('confirmation1', confirmation1);
        //console.log('confirmation2', confirmation2);
        difference = balance2-balance1;
        if(difference>19){
            assert.ok(true);
            console.log(difference);    
        }
           
    });

    it('can submit a Bid and an Ask to exchange from Household Contract', async () =>{
        addressExchange = exchange.options.address;
        
        //set the exchange address necessary to interact with it
        await household1.methods.setExchange(addressExchange).send({
            from: accounts[0],
            gas: '1000000'
        });
        await household2.methods.setExchange(addressExchange).send({
            from: accounts[1],
            gas: '1000000'
        });
        await exchange.methods.deposit().send({
            from:accounts[2],
            gas: '1000000',
            value:  web3.utils.toWei( '1', 'ether')
        });

        date = (new Date()).getTime();

        await household1.methods.submitBid(10, 1000, date).send({
            from: accounts[0],
            gas: '1000000'
        });

        date = (new Date()).getTime();

        await household2.methods.submitAsk(11, 1000, date).send({
           from: accounts[1],
           gas: '1000000'
        });


        bids = await exchange.methods.Bids(0).call();
        bidsCount = await exchange.methods.getBidsCount().call();
        assert(bids.amount, 1000);
        assert(bids.price, 10);
        assert(bidsCount, 1);
    });

    it('can place a Bid and remove it from the exchange', async () =>{
        addressExchange = exchange.options.address;
        
        //set the exchange address necessary to interact with it
        await household1.methods.setExchange(addressExchange).send({
            from: accounts[0],
            gas: '1000000'
        });
        await household2.methods.setExchange(addressExchange).send({
            from: accounts[1],
            gas: '1000000'
        });
        //place bid and ask
        date = (new Date()).getTime();
        await household1.methods.submitBid(10, 1000, date).send({
            from: accounts[0],
            gas: '1000000'
        });
        date = (new Date()).getTime();
        await household2.methods.submitAsk(11, 1000, date).send({
           from: accounts[1],
           gas: '1000000'
        });

        //remove them
        await household1.methods.deleteBid(0).send({
            from: accounts[0],
            gas: '1000000'
        });
        await household2.methods.deleteAsk(0).send({
            from: accounts[1],
            gas: '1000000'
        });
        let exchangeBids = await exchange.methods.getBidsCount().call();
        let exchangeAsks = await exchange.methods.getAsksCount().call();

        assert(exchangeBids, 0);
        assert(exchangeAsks, 0);


    });

    it('can submit a Bid and Ask which match', async () =>{
        addressExchange = exchange.options.address;
        
        //set the exchange address necessary to interact with it
        await household1.methods.setExchange(addressExchange).send({
            from: accounts[0],
            gas: '1000000'
        });
        await household2.methods.setExchange(addressExchange).send({
            from: accounts[1],
            gas: '1000000'
        });
        await household3.methods.setExchange(addressExchange).send({
            from: accounts[2],
            gas: '1000000'
        });
        //deposit some ether to exchange
        await exchange.methods.deposit().send({
            from:accounts[2],
            gas: '1000000',
            value:  web3.utils.toWei( '1', 'ether')
        });
        
        //check on amountOfCharge and balance before transaction
        pre_amountOfCharge1 = await household1.methods.amountOfCharge().call();
        pre_amountOfCharge2 = await household2.methods.amountOfCharge().call();
        pre_balance1 = await web3.eth.getBalance(household1.options.address);
        pre_balance2 = await web3.eth.getBalance(household2.options.address);
        console.log('amount of charge of contract1',pre_amountOfCharge1);
        console.log('amount of charge of contrac 2', pre_amountOfCharge2);
        console.log('pre balance of contract 1',pre_balance1);
        console.log('pre balance of contract 2', pre_balance2);

        try {
            date = (new Date()).getTime();
            //send a Bid and an Ask that will match to provoke a transaction between both contracts(Households)
            await household3.methods.submitBid(10, 1000, date).send({
                from: accounts[2],
                gas: '1999999'
            });
            date = (new Date()).getTime();
            await household1.methods.submitBid(10, 1000, date).send({
                from: accounts[0],
                gas: '1999999'
            });
            date = (new Date()).getTime();
            await household2.methods.submitAsk(10, 2000, date).send({
                from: accounts[1],
                gas: '1999999'
            });


            //check on amountOfCharge after transaction
            let exchangeBids = await exchange.methods.getBidsCount().call();
            let exchangeAsks = await exchange.methods.getAsksCount().call();

            post_amountOfCharge1 = await household1.methods.amountOfCharge().call();
            post_amountOfCharge2 = await household2.methods.amountOfCharge().call();
            post_balance1 = await web3.eth.getBalance(household1.options.address);
            post_balance2 = await web3.eth.getBalance(household2.options.address);
            console.log('exchange bids', exchangeBids);
            console.log('exchange asks', exchangeAsks);
            console.log('post amount of charge of contract1',post_amountOfCharge1);
            console.log('post amount of charge of contract 2', post_amountOfCharge2);
            console.log('post balance of contract 1',post_balance1);
            console.log('post balance of contract 2', post_balance2);
            assert(exchangeBids,0);
            assert(exchangeAsks, 0);
         } catch(err) {
            console.log(err);
         }
         

    });
})