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

const { abi: V3SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { abi: PeripheryPaymentsABI } = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/IPeripheryPayments.sol/IPeripheryPayments.json");
const { abi: MulticallABI } = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/IMulticall.sol/IMulticall.json");

const V3SwapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
const WETHAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
const USDCAddress = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F';
const UNIADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

export async function quote(): Promise<string> {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi.concat(MulticallABI),
    getProvider()
  )
  const poolConstants = await getPoolConstants()

  const quotedAmountOut1 = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    0
  )

  const quotedAmountOut2 = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    0
  )

  const calls = [quotedAmountOut1,quotedAmountOut2]

  const encMultiCall = await quoterContract.callStatic.quoteExactInputSingle(
    calls
  )

  return toReadableAmount(encMultiCall, CurrentConfig.tokens.out.decimals)
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

quote()