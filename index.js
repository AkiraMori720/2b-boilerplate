const axios = require('axios');

const TRNSACTION_TYPE_DEPOSIT = 'DEPOSIT';
const TRNSACTION_TYPE_WITHDRAW = 'WITHDRAW';

// Read records from CSV file
function readData()
{
    var fs = require('fs');
    var textByLine = fs.readFileSync('./data/transactions.csv').toString().split("\n"); 
    var i;
    console.log('All Records: ', textByLine.length);

    const fields = textByLine[0].split(",");
    console.log('Feilds: ', fields);

    let data = [];
    for (i = 1; i < textByLine.length - 1; i++) {
        let values = textByLine[i].split(",");
        data.push({
            timestamp: values[0],
            transaction_type: values[1],
            token: values[2],
            amount: values[3],
        })
    }
    return data;
}

// Calculate token amount from records
// Add amount of "DEPOSIT" type record
// Substract amount of "WITHDRAW" type record
function calculateTokenAmounts (data){
    let tokenAmounts = {};
    for(i =0; i < data.length; i++){
        let tokenAmount = (data[i].transaction_type === TRNSACTION_TYPE_DEPOSIT ? 1 : (-1)) * data[i].amount;
        if(tokenAmounts[data[i].token] == undefined){
            tokenAmounts[data[i].token] = 0;
        }
        tokenAmounts[data[i].token] += tokenAmount;
    }
    return tokenAmounts;
}


// Get Token Price with cryptocompare api
async function getTokenPrice (token) {
    try {
        let response = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD`);
        return response.data.USD;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Get portfolio with token`s price and amount
async function getPortfolio (amounts){
    let tokens = Object.keys(amounts);
    let portfolios = {};
    for(i =0; i < tokens.length; i++){
        let price = await getTokenPrice(tokens[i]);
        if(price !== null){
            portfolios[tokens[i]] = {
                amount: amounts[tokens[i]],
                price : price * amounts[tokens[i]],
            };
        }
    }
    return portfolios;
}

// Read records
let data = readData();

// Calcuate token`s amount
let tokenAmounts = calculateTokenAmounts(data);

// Get portfolios
getPortfolio(tokenAmounts).then(portfolios => {
    // Print Portfolios
    let tokens = Object.keys(portfolios);
    for(i=0; i < tokens.length; i++){
        console.log(`Token: ${tokens[i]} Amount: ${portfolios[tokens[i]].amount}  Price: ${portfolios[tokens[i]].price}`);
    }
});

