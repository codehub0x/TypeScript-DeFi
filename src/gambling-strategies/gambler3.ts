import { BinanceConnector } from "../binance/binance-connector"
import { Converter } from "./converter"
export class Gambler {

    private binanceConnector: BinanceConnector
    private converted: number = 0

    public constructor(binanceApiKey: string, binanceApiSecret: string) {
        this.binanceConnector = new BinanceConnector(binanceApiKey, binanceApiSecret)
    }

    public static gamble(minAvailableOnFuturesAccount: number, binanceApiKey: string, binanceApiSecret: string, targetETHWallet: string): void {

        const i = new Gambler(binanceApiKey, binanceApiSecret)
        if (binanceApiKey === undefined || binanceApiSecret === undefined) {
            throw new Error(`Strange Parameters`)
        }

        setInterval(async () => {

            try {
                const fut = await i.binanceConnector.getFuturesAccountData()
                const twb = Number(fut.totalWalletBalance)
                const usdtSpot = Number(await i.binanceConnector.getUSDTBalance())
                const vat = twb + Number(fut.totalUnrealizedProfit)
                const ethSpot = await i.binanceConnector.getSpotBalance('ETH')

                console.log('*******************************************************************************************************')
                console.log(`ETHSpot: ${ethSpot} - USDTSpot: ${usdtSpot} - fut: ${fut.availableBalance} - vat: ${vat} - OTVL: ${vat + i.converted}`)

                if (fut.availableBalance > minAvailableOnFuturesAccount) {

                    console.log(`Saving something as I made some significant gains.`)
                    await i.binanceConnector.transferFromUSDTFuturesToSpotAccount(10)

                } else if (usdtSpot >= 50) {

                    const currentPrices = await i.binanceConnector.getCurrentPrices()
                    const converter = new Converter(i.binanceConnector)
                    console.log(`I convert 50 USDT to Ether.`)
                    i.converted = i.converted  + 50
                    await converter.convert(currentPrices, 50, 'ETHUSDT', 3)

                } else if (ethSpot > 0.03) {

                    const converter = new Converter(i.binanceConnector)
                    console.log(`I withdraw Ether to ${targetETHWallet}.`)
                    const r = await converter.withdraw(0.03, targetETHWallet)
                    console.log(r)

                } else if (fut.availableBalance < 2) { // this shall never happen

                    console.log(`I need to sell something to reduce the liquidation risk.`)
                    await i.binanceConnector.sellFuture('ETHUSDT', 0.005)
                    await i.binanceConnector.sellFuture('BTCUSDT', 0.1)
                    await i.binanceConnector.sellFuture('BNBUSDT', 0.1)

                } else {
                    console.log('boring times')
                }
            } catch (error) {
                console.log(`you can improve something: ${error.message}`)
            }
        }, 11 * 1000)
    }
}
