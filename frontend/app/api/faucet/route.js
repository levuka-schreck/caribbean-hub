import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request) {
  try {
    const { address } = await request.json();

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      );
    }

    // Connect to Anvil
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    
    // Use funded Anvil account
    const wallet = new ethers.Wallet(
      process.env.ETH_FAUCET_PRIVATE_KEY,
      provider
    );

    // Send 100 ETH (Anvil test environment)
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther('100.0'),
      maxFeePerGas: ethers.parseUnits("2", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
    });

    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      amount: '100.0',
    });
  } catch (error) {
    console.error('ETH faucet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send ETH' },
      { status: 500 }
    );
  }
}
