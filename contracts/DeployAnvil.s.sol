// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/GroupPurchasing.sol";

/**
 * @title DeployAnvil
 * @dev Simple deployment script for Anvil using default account
 *
 * Usage:
 * 1. Start Anvil: anvil
 * 2. Deploy: forge script script/DeployAnvil.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 *
 * Note: The private key above is Anvil's first default test account
 */
contract DeployAnvil is Script {
    function run() external {
        // Anvil default account #0 private key
        // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));
        console.log("Deployer USDC balance:", usdc.balanceOf(msg.sender) / 10**6, "USDC");

        // Deploy GroupPurchasing with USDC address
        GroupPurchasing groupPurchasing = new GroupPurchasing(address(usdc));
        console.log("GroupPurchasing deployed at:", address(groupPurchasing));

        vm.stopBroadcast();

        console.log("===========================");
        console.log("Deployment Summary");
        console.log("===========================");
        console.log("Network: Anvil localhost:8545");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("MockUSDC:", address(usdc));
        console.log("GroupPurchasing:", address(groupPurchasing));
    }
}
