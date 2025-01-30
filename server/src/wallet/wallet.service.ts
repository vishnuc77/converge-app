import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { assets, Asset, AssetFuel,CHAIN_IDS, getAssetFuel, Wallet, Provider, WalletUnlocked, BN } from 'fuels';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import axios from 'axios';
import { WalletDocument } from '../schemas/wallet.schema';
import { PromptService } from '../services/prompt.service';
import { StarknetService } from '../services/starknet.service';
import { executeSwap, fetchQuotes, fetchTokens, Quote } from "@avnu/avnu-sdk";
import {  OrbiterClient, ENDPOINT, TradePair, RouterType } from "@orbiter-finance/bridge-sdk";

dotenv.config();

@Injectable()
export class WalletService {
  private provider: Provider;
  private readonly LAYERSWAP_API_URL = 'https://api.layerswap.io/api/v2';

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private starknetService: StarknetService
  ) {}

  private async encryptPrivateKey(privateKey: string): Promise<string> {
    const secretKey = process.env.AES_SECRET_KEY;
    const iv = process.env.AES_IV;

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async createWallet(email: string, appwriteUserId: string) {
    const wallet = await this.starknetService.generateAccount();
    const privateKey = wallet.privateKey;
    const publicKey = wallet.publicKey;
    const address = wallet.accountAddress;

    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey);

    const newWallet = new this.walletModel({
      email,
      publicKey,
      encryptedPrivateKey,
      address,
      appwriteUserId,
    });

    await newWallet.save();

    return {
      appwriteUserId,
      email,
      address,
      publicKey,
    };
  }

  async getBalance(userId: string, tokenAddress: string) {
    // First get the wallet using userId
    const wallet = await this.walletModel.findOne({ appwriteUserId: userId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }
    
    const balance: bigint = await this.starknetService.getTokenBalance(wallet.address.toString(), tokenAddress);
    
    return { balance: balance.toString() };
  }

  async transferTokens(
    userId: string,
    receiverAddress: string,
    amount: number,
    tokenAddress: string,
  ) {
    const wallet = await this.walletModel.findOne({ appwriteUserId: userId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    const decryptedPrivateKey = await this.decryptPrivateKey(wallet.encryptedPrivateKey);
    
    try {
      // Verify source wallet exists and get its details
      const isSourceAccountDeployed = await this.starknetService.isAccountDeployed(wallet.address);
      if (!isSourceAccountDeployed) {
        await this.starknetService.deployAccount(decryptedPrivateKey);
      }
      
      const txId = await this.starknetService.transfer(
        decryptedPrivateKey, receiverAddress, tokenAddress, BigInt(amount)
      );

      return {txId: txId};
    } catch (error) {
      console.error("Transfer failed:", error);
      throw new Error('Transfer failed');
    }
  }

  async getWalletByEmail(email: string) {
    const wallet = await this.walletModel.findOne({ email }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this email');
    }
    
    return {
      publicKey: wallet.publicKey,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
      address: wallet.address,
    };
  }

  async getWalletByUserId(appwriteUserId: string) {
    const wallet = await this.walletModel.findOne({ appwriteUserId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }
    
    return {
      email: wallet.email,
      publicKey: wallet.publicKey,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
      address: wallet.address,
    };
  }

  private async decryptPrivateKey(encryptedPrivateKey: string): Promise<string> {
    const secretKey = process.env.AES_SECRET_KEY;
    const iv = process.env.AES_IV;

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async processPrompt(prompt: string) {
    try {
        const message = await PromptService.processPrompt(prompt);
        console.log("Hello2");
        console.log(message);
        
        return {message}
    } catch (error) {
        console.error('Error processing prompt:', error);
        throw new InternalServerErrorException(error.message || 'Failed to process prompt');
    }
  }

  async fetchSwapQuotes(
    userId: string,
    sellTokenAddress: string,
    buyTokenAddress: string,
    sellAmount: number,
  ) {
    const wallet = await this.walletModel.findOne({ appwriteUserId: userId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    const AVNU_OPTIONS = { baseUrl: 'https://sepolia.api.avnu.fi' };
    const strkAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
    const params = {
      sellTokenAddress: sellTokenAddress,
      buyTokenAddress: strkAddress,
      sellAmount: BigInt(sellAmount),
      takerAddress: wallet.address,
    }
    console.log(params);

    try {
      const quotes = await fetchQuotes(params, AVNU_OPTIONS);
      console.log(quotes);
      const buyAmount = quotes[0].buyAmount.toString();
      return { buyAmount };
    } catch (error) {
      console.error('Error fetching swap quotes:', error);
      throw new InternalServerErrorException('Failed to fetch swap quotes');
    }
  }

  async executeSwap(
    userId: string,
    sellTokenAddress: string,
    buyTokenAddress: string,
    sellAmount: number,
  ) {
    const wallet = await this.walletModel.findOne({ appwriteUserId: userId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    const decryptedPrivateKey = await this.decryptPrivateKey(wallet.encryptedPrivateKey);

    try {
      // Verify account is deployed
      const isAccountDeployed = await this.starknetService.isAccountDeployed(wallet.address);
      if (!isAccountDeployed) {
        await this.starknetService.deployAccount(decryptedPrivateKey);
      }

      // Execute the swap
      const txId = await this.starknetService.swap(
        decryptedPrivateKey,
        wallet.address,
        sellTokenAddress,
        buyTokenAddress,
        BigInt(sellAmount)
      );

      return { txId: txId };
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new InternalServerErrorException('Failed to execute swap');
    }
  }

  async getBridgeStatus(
    transactionHash: string
  ) {
    const orbiter = await OrbiterClient.create({
      apiEndpoint: ENDPOINT.MAINNET,
      apiKey: 'xxxxxx', //optional
      channelId: 'xxxxxx' //optional
    });

    const status = await orbiter.getTransactionStatus(transactionHash, 'SN_MAIN');
    return status;
  }

  async executeBridge(
    userId: string,
  ) {
    const wallet = await this.walletModel.findOne({ appwriteUserId: userId }).exec();
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    const decryptedPrivateKey = await this.decryptPrivateKey(wallet.encryptedPrivateKey);

    try {
      // Check account deployment status
      const isAccountDeployed = await this.starknetService.isAccountDeployed('0x03d1d0bef48a2f489e803426b924553709e80c46549c0071a468602156eccccf');
      console.log(isAccountDeployed);
      if (!isAccountDeployed) {
        await this.starknetService.deployAccount('0x0697cd72398c9d12a0639dc1fc151346288bff2f7f4af7df58470765b8dd30a1');
      }

      // Execute the swap
      const txId = await this.starknetService.bridge(
        decryptedPrivateKey,
        '0x03d1d0bef48a2f489e803426b924553709e80c46549c0071a468602156eccccf'
      );

      return { txId: txId };
    } catch (error) {
      console.error('Error executing bridge:', error);
      throw new InternalServerErrorException('Failed to execute bridge');
    }
  }
}
