import { Injectable } from '@nestjs/common';
import {
  Account,
  ec,
  stark,
  RpcProvider,
  RpcProviderOptions,
  hash,
  CallData,
  constants,
  Call,
  uint256,
  AllowArray,
} from 'starknet';
import { executeSwap, fetchQuotes, fetchTokens, Quote } from "@avnu/avnu-sdk";
import {  OrbiterClient, ENDPOINT, TradePair, RouterType } from "@orbiter-finance/bridge-sdk";
import * as dotenv from 'dotenv';

dotenv.config();

const nodeUrls: Record<constants.StarknetChainId, string> = {
  [constants.StarknetChainId.SN_MAIN]: 'https://starknet-mainnet.public.blastapi.io',
  [constants.StarknetChainId.SN_SEPOLIA]: 'https://starknet-sepolia.public.blastapi.io',
};

const UPGRADE_FEE_MULTIPLIER = 50;

@Injectable()
export class StarknetService {
  private classHash = process.env.ARGENT_ACCOUNT_CLASS_HASH;
  private provider: RpcProvider;

  constructor() {
    const chainId =
        process.env.APP_ENV === 'live' ? constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA;

    const options: RpcProviderOptions = {
      nodeUrl: nodeUrls[chainId],
      chainId,
    };
    
    this.provider = new RpcProvider(options);
  }

  async isAccountDeployed(accountAddress: string): Promise<boolean> {
    // Check if class hash exists at the given address
    try {
      const classHash = await this.provider.getClassHashAt(accountAddress);
      return !!classHash;
    } catch (error) {
      console.log(this.provider)
      console.log(error);
      if (error.message.includes('Contract not found')) {
        return false; // Contract is not deployed
      }

      throw error;
    }
  }

  async generateAccount(): Promise<{ accountAddress: string; privateKey: string; publicKey: string }> {
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    const accountAddress = this.computeAccountAddress(privateKey);

    return {
      accountAddress,
      privateKey,
      publicKey,
    };
  }

  computeAccountAddress(privateKey: string): string {
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    const constructorCallData = CallData.compile({
      owner: publicKey,
      guardian: '0',
    });

    const accountAddress = hash.calculateContractAddressFromHash(
      publicKey,
      this.classHash,
      constructorCallData,
      0
    );

    return accountAddress;
  }

  async deployAccount(privateKey: string): Promise<string> {
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    const accountAddress = this.computeAccountAddress(privateKey);

    const calldata = CallData.compile({
      owner: publicKey,
      guardian: '0',
    });
    const account = new Account(this.provider, accountAddress, privateKey);

    const deployAccountPayload = {
      classHash: this.classHash,
      constructorCalldata: calldata,
      contractAddress: accountAddress,
      addressSalt: publicKey,
    };

    const { transaction_hash, contract_address } = await account.deployAccount(deployAccountPayload);

    await account.waitForTransaction(transaction_hash);
    return contract_address;
  }

  async getTokenBalance(accountAddress: string, tokenAddress: string): Promise<bigint> {
    // Call the contract to get the account's balance
    const balanceCall: Call = {
      contractAddress: tokenAddress,
      entrypoint: 'balanceOf',
      calldata: [accountAddress],
    };
    
    const balanceResponse = await this.provider.callContract(balanceCall);
    console.log(balanceResponse);
    const balance = BigInt(balanceResponse[0]);
    return balance;
  }

  async transfer(
    privateKey: string,
    toAddress: string,
    tokenAddress: string,
    amount: bigint
  ): Promise<string> {
    const accountAddress = this.computeAccountAddress(privateKey);

    const account = new Account(this.provider, accountAddress, privateKey);

    const { low: amountLow, high: amountHigh } = uint256.bnToUint256(amount);

    const transferCall: Call = {
      contractAddress: tokenAddress,
      entrypoint: 'transfer',
      calldata: [toAddress, amountLow, amountHigh],
    };

    const { transaction_hash } = await account.execute(transferCall);
    await account.waitForTransaction(transaction_hash);

    return transaction_hash;
  }

  async swap(
    privateKey: string,
    accountAddress: string,
    sellTokenAddress: string,
    buyTokenAddress: string,
    sellAmount: bigint,
  ): Promise<string> {
    const account = new Account(this.provider, accountAddress, privateKey);

    const AVNU_OPTIONS = { baseUrl: 'https://sepolia.api.avnu.fi' };
    const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
    const params = {
      sellTokenAddress: sellTokenAddress,
      buyTokenAddress: strkAddress,
      sellAmount: sellAmount,
      takerAddress: accountAddress,
    }

    const quotes = await fetchQuotes(params, AVNU_OPTIONS);

    const res = await executeSwap(account, quotes[0], {}, AVNU_OPTIONS);
    console.log(res);

    return res.transactionHash;
  }

  async upgradeAccount(privateKey: string, newClassHash: string): Promise<{ transaction_hash: string }> {
    const accountAddress = this.computeAccountAddress(privateKey);

    const account = new Account(this.provider, accountAddress, privateKey);

    const upgradeCall: Call = {
      contractAddress: accountAddress,
      entrypoint: 'upgrade',
      calldata: CallData.compile([newClassHash]),
    };

    const expectedFee = await account.estimateFee(upgradeCall);
    const response = await account.execute(upgradeCall, undefined, {
      maxFee: expectedFee.overall_fee * BigInt(UPGRADE_FEE_MULTIPLIER),
    });

    await account.waitForTransaction(response.transaction_hash);
    return response;
  }

  async bridge(
    privateKey: string,
    accountAddress: string
  ): Promise<string> {
    const orbiter = await OrbiterClient.create({
      apiEndpoint: ENDPOINT.MAINNET,
      apiKey: 'xxxxxx', //optional
      channelId: 'xxxxxx' //optional
    });
    // choose a tradePair to create router
    const chains = await orbiter.getAllChains();

    const tradePair: TradePair = {
      srcChainId: 'SN_MAIN',
      dstChainId: '8453',
      srcTokenSymbol: 'ETH',
      dstTokenSymbol: 'ETH',
      routerType: RouterType.CONTRACT
    }
    const router = orbiter.createRouter(tradePair);

    const min = router.getMinSendAmount();
    const max = router.getMaxSendAmount();
    console.log(min);
    const { sendAmount, receiveAmount } = router.simulationAmount(min);

    const account = new Account(this.provider, '0x03d1d0bef48a2f489e803426b924553709e80c46549c0071a468602156eccccf', '0x0697cd72398c9d12a0639dc1fc151346288bff2f7f4af7df58470765b8dd30a1');

    // create approve
    const approve = await router.createApprove(account.address, sendAmount);

    // create transaction
    const transaction = await router.createTransaction(accountAddress, ' 0x90Ef3B879048CdE908e0CF236F3Cf06b1e5B5597', sendAmount);

    // send approve and transaction
    const transactionResponce = await account.execute(transaction.raw as AllowArray<Call>);
    const transactionReceipt = await this.provider.waitForTransaction(transactionResponce.transaction_hash);

    return transactionReceipt.statusReceipt;
  }

  /**
   * Retrieves the class hash for a given Starknet account address
   * @param accountAddress - The Starknet account address
   * @returns Promise<string> The class hash of the account
   */
  async getAccountClassHash(accountAddress: string): Promise<string> {
    const classHash = await this.provider.getClassHashAt(accountAddress);
    return classHash;
  }
}
