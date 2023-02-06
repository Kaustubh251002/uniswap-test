import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { computePoolAddress } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from '../libs/constants'
import { getProvider } from '../libs/providers'
import { toReadableAmount, fromReadableAmount } from '../libs/conversion'

//IMPORTING THE MULTICALL ABI
const { abi: MulticallABI } = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/IMulticall.sol/IMulticall.json");

export async function quote(): Promise<string> {
  
  //CONCATINATING ABIs OF THE QUOTER AND THE MULTICALL CONTRACT
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi.concat(MulticallABI),
    getProvider()
  )
  const poolConstants = await getPoolConstants()

  //CALCULTAING 2 OUTVALUES WITHOUT EXECUTING SWAPS
  const quotedAmountOut = await quoterContract.quoteExactInput(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    0
  )

  const quotedAmountOut2 = await quoterContract.quoteExactInput(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    0
  )
  
  //ARRAY OF MULTICALLS
  var calls = [quotedAmountOut, quotedAmountOut2]
  var data = 0
  
  //EXECUTING THE MULTICALL (ERROR:TOO MANY ARGUMENTS SENT TO CONTRACT)
  try {
    data = await quoterContract.methods.multicall(calls).send();
  } catch (err) {
    console.log(err);
  }
  return String(data)
}

async function getPoolConstants(): Promise<{
  token0: string
  token1: string
  fee: number
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider()
  )
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ])

  return {
    token0,
    token1,
    fee,
  }
}
