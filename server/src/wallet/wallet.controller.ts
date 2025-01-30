import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async createWallet(
    @Body() createWalletDto: { email: string; appwriteUserId: string },
  ) {
    return this.walletService.createWallet(
      createWalletDto.email,
      createWalletDto.appwriteUserId,
    );
  }

  @Get('balance')
  async getBalance(
    @Query('userId') userId: string,
    @Query('tokenAddress') tokenAddress: string,
  ) {
    return this.walletService.getBalance(userId, tokenAddress);
  }

  @Get('swap-quotes')
  async fetchSwapQuotes(
    @Query('userId') userId: string,
    @Query('sellTokenAddress') sellTokenAddress: string,
    @Query('buyTokenAddress') buyTokenAddress: string,
    @Query('sellAmount') sellAmount: number,
  ) {
    return this.walletService.fetchSwapQuotes(
      userId,
      sellTokenAddress,
      buyTokenAddress,
      sellAmount,
    );
  }

  @Get('bridge-status')
  async getBridgeQuotes(
    @Query('transactionHash') transactionHash: string,
  ) {
    return this.walletService.getBridgeStatus(
      transactionHash
    );
  }

  @Get(':userId')
  async getWallet(@Param('userId') userId: string) {
    return this.walletService.getWalletByUserId(userId);
  }

  @Post('transfer')
  async transferTokens(
    @Body()
    transferData: {
      userId: string;
      to: string;
      amount: number;
      tokenAddress: string;
    },
  ) {
    return this.walletService.transferTokens(
      transferData.userId,
      transferData.to,
      transferData.amount,
      transferData.tokenAddress,
    );
  }

  @Post('process-prompt')
  async processPrompt(@Body('prompt') prompt: string) {
    return this.walletService.processPrompt(prompt);
  }

  @Post('swap')
  async executeSwap(
    @Body()
    swapData: {
      userId: string;
      sellTokenAddress: string;
      buyTokenAddress: string;
      sellAmount: number;
    },
  ) {
    return this.walletService.executeSwap(
      swapData.userId,
      swapData.sellTokenAddress,
      swapData.buyTokenAddress,
      swapData.sellAmount,
    );
  }

  @Post('bridge')
  async executeBridge(
    @Body()
    bridgeData: {
      userId: string;
    },
  ) {
    return this.walletService.executeBridge(
      bridgeData.userId,
    );
  }
}
