'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from '../Web3AuthContext';
import { CONTRACTS } from '../contracts/addresses';
import { getContainerTypeEnum } from '../data/ports';
import GroupPurchasingABI from '../contracts/GroupPurchasing.json';
import MockUSDCABI from '../contracts/MockUSDC.json';

export function useCampaigns() {
  const { provider, address, getSigner } = useWeb3Auth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInfiniteApproval, setHasInfiniteApproval] = useState(false);

  // Check if user has infinite USDC approval (once per session)
  const checkApproval = useCallback(async () => {
    if (!address || !provider || hasInfiniteApproval) return hasInfiniteApproval;
    
    try {
      const usdcContract = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        MockUSDCABI.abi,
        provider
      );
      
      const allowance = await usdcContract.allowance(address, CONTRACTS.GROUP_PURCHASING);
      const hasApproval = allowance >= ethers.MaxUint256 / 2n; // Check if it's a large approval
      setHasInfiniteApproval(hasApproval);
      return hasApproval;
    } catch (err) {
      console.error('Error checking approval:', err);
      return false;
    }
  }, [address, provider, hasInfiniteApproval]);

  // Approve USDC spending (one-time infinite approval)
  const approveUSDC = useCallback(async () => {
    try {
      const alreadyApproved = await checkApproval();
      if (alreadyApproved) {
        console.log('Already has infinite approval, skipping...');
        return { success: true, alreadyApproved: true };
      }

      const signer = await getSigner();
      const usdcContract = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        MockUSDCABI.abi,
        signer
      );
      
      console.log('Requesting infinite USDC approval...');
      const approveTx = await usdcContract.approve(
        CONTRACTS.GROUP_PURCHASING,
        ethers.MaxUint256,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      console.log('Waiting for approval confirmation...');
      await approveTx.wait();
      
      setHasInfiniteApproval(true);
      console.log('Infinite approval granted! No more approvals needed.');
      return { success: true, alreadyApproved: false };
    } catch (err) {
      console.error('Approval error:', err);
      return { success: false, error: err.message };
    }
  }, [checkApproval, getSigner]);

  // Get contract instances
  const getContracts = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    
    // Validate contract addresses
    if (!CONTRACTS.GROUP_PURCHASING || typeof CONTRACTS.GROUP_PURCHASING !== 'string') {
      throw new Error('Invalid GroupPurchasing contract address');
    }
    if (!CONTRACTS.MOCK_USDC || typeof CONTRACTS.MOCK_USDC !== 'string') {
      throw new Error('Invalid MockUSDC contract address');
    }
    
    console.log('Contract addresses:', {
      groupPurchasing: CONTRACTS.GROUP_PURCHASING,
      mockUsdc: CONTRACTS.MOCK_USDC,
    });
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Signer not available');
    }
    
    const gpContract = new ethers.Contract(
      CONTRACTS.GROUP_PURCHASING,
      GroupPurchasingABI.abi,
      signer
    );
    const usdcContract = new ethers.Contract(
      CONTRACTS.MOCK_USDC,
      MockUSDCABI.abi,
      signer
    );
    return { gpContract, usdcContract };
  }, [provider, getSigner]);

  // Create single product campaign
  const createProductCampaign = useCallback(async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const { gpContract } = await getContracts();
      
      console.log('Raw campaign data:', campaignData);
      
      // Keep it simple - pass raw values and let ethers.js handle conversion
      const minQuantity = campaignData.minQuantity;
      const pricePerUnit = ethers.parseUnits(campaignData.pricePerUnit, 6);
      const targetAmount = ethers.parseUnits(campaignData.targetAmount, 6);
      const deadline = Math.floor(new Date(campaignData.deadline).getTime() / 1000);
      
      console.log('Calling createSingleProductCampaign with:', {
        name: campaignData.name,
        description: campaignData.description,
        minQuantity: minQuantity,
        pricePerUnit: pricePerUnit.toString(),
        unit: campaignData.unit,
        targetAmount: targetAmount.toString(),
        deadline: deadline,
      });
      
      // Call contract function with reasonable gas prices
      const tx = await gpContract.createSingleProductCampaign(
        campaignData.name,
        campaignData.description,
        minQuantity,
        pricePerUnit,
        campaignData.unit,
        targetAmount,
        deadline,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      const campaignCounter = await gpContract.campaignCounter();
      const campaignId = campaignCounter - 1n;
      
      return { success: true, campaignId: campaignId.toString(), receipt };
    } catch (err) {
      console.error('Create product campaign error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        data: err.data,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContracts]);

  // Create container campaign
  const createContainerCampaign = useCallback(async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const { gpContract } = await getContracts();
      
      console.log('Raw container campaign data:', campaignData);
      
      // Get the enum value for container type
      const containerTypeEnum = getContainerTypeEnum(campaignData.containerType);
      
      // ContainerRequirements struct - keep it simple
      const containerReqs = {
        containerType: containerTypeEnum,
        minTempCelsius: parseInt(campaignData.minTemperature) || 0,
        maxTempCelsius: parseInt(campaignData.maxTemperature) || 0,
        maxWeightKg: campaignData.maxWeightKg, // Let ethers handle conversion
        currentWeightKg: 0,
        requiresVentilation: Boolean(campaignData.ventilationRequired),
        requiresRefrigeration: Boolean(campaignData.temperatureControlled),
      };

      const targetAmount = ethers.parseUnits(campaignData.targetAmount, 6);
      const deadline = Math.floor(new Date(campaignData.deadline).getTime() / 1000);

      console.log('Calling createContainerCampaign with:', {
        name: campaignData.name,
        description: campaignData.description,
        direction: parseInt(campaignData.direction),
        originPort: campaignData.originPort,
        destinationPort: campaignData.destinationPort,
        containerReqs,
        targetAmount: targetAmount.toString(),
        deadline,
      });

      const tx = await gpContract.createContainerCampaign(
        campaignData.name,
        campaignData.description,
        parseInt(campaignData.direction),
        campaignData.originPort,
        campaignData.destinationPort,
        containerReqs,
        targetAmount,
        deadline,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      const campaignCounter = await gpContract.campaignCounter();
      const campaignId = campaignCounter - 1n;
      
      return { success: true, campaignId: campaignId.toString(), receipt };
    } catch (err) {
      console.error('Create container campaign error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        data: err.data,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContracts]);

  // Get all campaigns
  const getAllCampaigns = useCallback(async () => {
    if (!provider) return [];
    
    try {
      const gpContract = new ethers.Contract(
        CONTRACTS.GROUP_PURCHASING,
        GroupPurchasingABI.abi,
        provider
      );
      
      const counter = await gpContract.campaignCounter();
      const campaigns = [];
      
      for (let i = 1n; i < counter; i++) {
        try {
          const campaign = await gpContract.getCampaign(i);
          // Correct field mapping: 0: organizer, 1: campaignType, 2: direction, 3: productName,
          // 4: productDescription, 5: minOrderQuantity, 6: currentQuantity, 7: pricePerUnit,
          // 8: unit, 9: targetAmount, 10: currentAmount, 11: deadline, 12: status,
          // 13: createdAt, 14: participantCount, 15: originPort, 16: destinationPort
          
          campaigns.push({
            id: i.toString(),
            creator: campaign[0] ? String(campaign[0]) : '', // organizer
            campaignType: Number(campaign[1]),
            direction: Number(campaign[2]),
            name: campaign[3],
            description: campaign[4],
            minQuantity: campaign[5]?.toString(),
            currentQuantity: campaign[6]?.toString(),
            pricePerUnit: campaign[7] ? ethers.formatUnits(campaign[7], 6) : '0',
            unit: campaign[8],
            targetAmount: ethers.formatUnits(campaign[9], 6),
            currentAmount: ethers.formatUnits(campaign[10], 6),
            deadline: new Date(Number(campaign[11]) * 1000),
            status: Number(campaign[12]),
            createdAt: new Date(Number(campaign[13]) * 1000),
            participantCount: campaign[14].toString(),
            originPort: campaign[15],
            destinationPort: campaign[16],
            currentWeightKg: '0', // Would need getContainerRequirements for actual value
          });
        } catch (err) {
          console.error(`Error fetching campaign ${i}:`, err);
        }
      }
      
      return campaigns;
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      return [];
    }
  }, [provider]);

  // Get single campaign
  const getCampaign = useCallback(async (campaignId) => {
    if (!provider) return null;
    
    try {
      const gpContract = new ethers.Contract(
        CONTRACTS.GROUP_PURCHASING,
        GroupPurchasingABI.abi,
        provider
      );
      
      const campaign = await gpContract.getCampaign(campaignId);
      
      // Correct field mapping based on contract ABI:
      // 0: organizer, 1: campaignType, 2: direction, 3: productName, 4: productDescription,
      // 5: minOrderQuantity, 6: currentQuantity, 7: pricePerUnit, 8: unit,
      // 9: targetAmount, 10: currentAmount, 11: deadline, 12: status, 13: createdAt,
      // 14: participantCount, 15: originPort, 16: destinationPort
      
      return {
        id: campaignId,
        creator: campaign[0] ? String(campaign[0]) : '', // organizer
        campaignType: Number(campaign[1]),
        direction: Number(campaign[2]),
        name: campaign[3],
        description: campaign[4],
        minQuantity: campaign[5]?.toString(),
        currentQuantity: campaign[6]?.toString(),
        pricePerUnit: campaign[7] ? ethers.formatUnits(campaign[7], 6) : '0',
        unit: campaign[8],
        targetAmount: ethers.formatUnits(campaign[9], 6),
        currentAmount: ethers.formatUnits(campaign[10], 6),
        deadline: new Date(Number(campaign[11]) * 1000),
        status: Number(campaign[12]),
        createdAt: new Date(Number(campaign[13]) * 1000),
        participantCount: campaign[14].toString(),
        originPort: campaign[15],
        destinationPort: campaign[16],
        currentWeightKg: '0', // Would need to get from containerReqs if needed
      };
    } catch (err) {
      console.error('Error fetching campaign:', err);
      return null;
    }
  }, [provider]);

  // Join product campaign
  const joinProductCampaign = useCallback(async (campaignId, quantity, shippingAddress, pricePerUnit) => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== JOIN PRODUCT CAMPAIGN START ===');
      console.log('Campaign ID:', campaignId);
      console.log('Quantity:', quantity);
      console.log('Price per unit:', pricePerUnit);
      console.log('Shipping address:', shippingAddress);
      
      // Calculate payment from provided pricePerUnit instead of fetching campaign again
      const paymentAmount = parseFloat(pricePerUnit) * quantity;
      const paymentWei = ethers.parseUnits(paymentAmount.toString(), 6);
      console.log('Payment amount:', paymentAmount, 'USDC');
      
      // Ensure approval (will skip if already approved)
      console.log('Checking USDC approval...');
      const approvalResult = await approveUSDC();
      if (!approvalResult.success) {
        throw new Error('Failed to approve USDC');
      }
      console.log('Approval OK');
      
      // Join campaign
      const signer = await getSigner();
      const gpContract = new ethers.Contract(
        CONTRACTS.GROUP_PURCHASING,
        GroupPurchasingABI.abi,
        signer
      );
      
      // Try manual gas estimation
      try {
        console.log('Estimating gas...');
        const estimate = await gpContract.joinSingleProductCampaign.estimateGas(
          campaignId,
          quantity,
          shippingAddress
        );
        console.log('Gas estimate:', estimate.toString());
      } catch (estErr) {
        console.error('Gas estimation error:', estErr.message);
      }
      
      console.log('Sending transaction...');
      const tx = await gpContract.joinSingleProductCampaign(
        campaignId,
        quantity,
        shippingAddress,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed! Gas used:', receipt.gasUsed.toString());
      return { success: true, receipt };
    } catch (err) {
      console.error('=== JOIN PRODUCT CAMPAIGN ERROR ===');
      console.error('Error:', err);
      console.error('Message:', err.message);
      console.error('Code:', err.code);
      if (err.data) console.error('Data:', err.data);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [approveUSDC, getSigner]);

  // Join container campaign
  const joinContainerCampaign = useCallback(async (campaignId, paymentAmount, weightKg, shippingAddress) => {
    setLoading(true);
    setError(null);
    try {
      const paymentWei = ethers.parseUnits(paymentAmount.toString(), 6);
      
      // Ensure approval (will skip if already approved)
      const approvalResult = await approveUSDC();
      if (!approvalResult.success) {
        throw new Error('Failed to approve USDC');
      }
      
      // Join campaign
      const signer = await getSigner();
      const gpContract = new ethers.Contract(
        CONTRACTS.GROUP_PURCHASING,
        GroupPurchasingABI.abi,
        signer
      );
      
      const tx = await gpContract.joinContainerCampaign(
        campaignId,
        paymentWei,
        weightKg,
        shippingAddress,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [approveUSDC, getSigner]);

  // Cancel campaign
  const cancelCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const { gpContract } = await getContracts();
      const tx = await gpContract.cancelCampaign(campaignId);
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContracts]);

  // Get container requirements for a campaign
  const getContainerRequirements = useCallback(async (campaignId) => {
    if (!provider) return null;
    
    try {
      const gpContract = new ethers.Contract(
        CONTRACTS.GROUP_PURCHASING,
        GroupPurchasingABI.abi,
        provider
      );
      
      const reqs = await gpContract.getContainerRequirements(campaignId);
      
      return {
        containerType: Number(reqs[0]),
        minTempCelsius: Number(reqs[1]),
        maxTempCelsius: Number(reqs[2]),
        maxWeightKg: reqs[3].toString(),
        currentWeightKg: reqs[4].toString(),
        requiresVentilation: reqs[5],
        requiresRefrigeration: reqs[6],
      };
    } catch (err) {
      console.error('Error fetching container requirements:', err);
      return null;
    }
  }, [provider]);

  return {
    loading,
    error,
    hasInfiniteApproval,
    checkApproval,
    approveUSDC,
    createProductCampaign,
    createContainerCampaign,
    getAllCampaigns,
    getCampaign,
    getContainerRequirements,
    joinProductCampaign,
    joinContainerCampaign,
    cancelCampaign,
  };
}
