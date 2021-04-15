
import { BinanceConnector } from "../../binance/binance-connector"

const intervalLengthInSeconds = Number(process.argv[2]) // e.g. 5
const size = Number(process.argv[3]) // e.g. 0.02
const threshold = Number(process.argv[4]) // e.g. 2
const binanceApiKey = process.argv[5]
const binanceApiSecret = process.argv[6]
const pair = process.argv[7] // e.g. BTCUSDT 
const limitRegardingBuyingTheDip = Number(process.argv[8]) // e.g. 0.85
const shortTermDipOrPumpIndicator = Number(process.argv[9]) // e.g. 1

console.log(`intervalLengthInSeconds: ${intervalLengthInSeconds}`) 
console.log(`size: ${size}`) 
console.log(`threshold: ${threshold}`) 
console.log(`binanceApiKey: ${binanceApiKey}`)
console.log(`binanceApiSecret: ${binanceApiSecret}`)
console.log(`pair: ${pair}`) 
console.log(`shortTermDipOrPumpIndicator: ${shortTermDipOrPumpIndicator}`)

const binanceConnector = new BinanceConnector(binanceApiKey, binanceApiSecret)

setInterval(async () => {

    const accountData = await binanceConnector.getFuturesAccountData()
    const xPosition = accountData.positions.filter((entry: any) => entry.symbol === pair)[0]
    const liquidityRatio = Number(accountData.maxWithdrawAmount) / Number(accountData.totalWalletBalance)

    const positionAmountAsNumber = Number(xPosition.positionAmt)
    const unrealizedProfitAsNumber = Number(xPosition.unrealizedProfit)

    if (positionAmountAsNumber === 0) {
        console.log(`buying ${size} ${pair}`)
        await binanceConnector.buyFuture(pair, size)
    } else {
        console.log(unrealizedProfitAsNumber)
        if (unrealizedProfitAsNumber >= threshold) {
            console.log(`selling ${xPosition.positionAmt} ${pair}`)
            await binanceConnector.sellFuture(pair, Number(xPosition.positionAmt))
            // play sound - https://www.freesoundslibrary.com/cow-moo-sounds/ & https://www.npmjs.com/package/play-sound
        } else if ((unrealizedProfitAsNumber < (shortTermDipOrPumpIndicator * -1)) && liquidityRatio > limitRegardingBuyingTheDip) {
            let buyTheDipFactor = Math.round(unrealizedProfitAsNumber)
            if (buyTheDipFactor >= 1) {
                console.log(`buying the dip with factor ${buyTheDipFactor}`)
                await binanceConnector.buyFuture(pair, ((size * buyTheDipFactor)))
            } else {
                console.log("waiting for the dip :)")
            }
        } else {
            console.log(`waiting until I made ${threshold} USD in profit`)
        }
    }

}, intervalLengthInSeconds * 1000)
