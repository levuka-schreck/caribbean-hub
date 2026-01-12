// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/GroupPurchasing.sol";
import "../src/ShippingRoutes.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));
        
        // Deploy GroupPurchasing
        GroupPurchasing groupPurchasing = new GroupPurchasing(address(usdc));
        console.log("GroupPurchasing deployed at:", address(groupPurchasing));
        
        // Deploy ShippingRoutes
        ShippingRoutes shippingRoutes = new ShippingRoutes(address(groupPurchasing));
        console.log("ShippingRoutes deployed at:", address(shippingRoutes));
        
        // Mint some test USDC to deployer
        usdc.mint(msg.sender, 1000000 * 10**6); // 1M USDC
        console.log("Minted 1,000,000 USDC to deployer");
        
        vm.stopBroadcast();
        
        // Output deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("MockUSDC:", address(usdc));
        console.log("GroupPurchasing:", address(groupPurchasing));
        console.log("ShippingRoutes:", address(shippingRoutes));
        console.log("Deployer:", msg.sender);
    }
}
