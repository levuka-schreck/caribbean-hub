'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from '../Web3AuthContext';
import { CONTRACTS } from '../contracts/addresses';
import ShippingRoutesABI from '../contracts/ShippingRoutes.json';

export function useRoutes() {
  const { provider, getSigner } = useWeb3Auth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get contract instance
  const getContract = useCallback(async () => {
    if (!provider) throw new Error('Provider not available');
    const signer = await getSigner();
    return new ethers.Contract(
      CONTRACTS.SHIPPING_ROUTES,
      ShippingRoutesABI.abi,
      signer
    );
  }, [provider, getSigner]);

  // Create shipping route
  const createRoute = useCallback(async (routeData) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      
      // Prepare port data arrays
      const portNames = routeData.ports.map(p => p.name);
      const portCodes = routeData.ports.map(p => p.code);
      const countries = routeData.ports.map(p => p.country);
      const arrivalTimes = routeData.ports.map(p => 
        Math.floor(new Date(p.arrivalTime).getTime() / 1000)
      );
      
      // Create route without campaign first
      const tx = await contract.createRoute(
        routeData.shipId,
        routeData.shipName,
        routeData.description,
        routeData.departurePort,
        portNames,
        portCodes,
        countries,
        arrivalTimes,
        routeData.capacity,
        routeData.refrigerationType || 0,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      const receipt = await tx.wait();
      const totalRoutes = await contract.getTotalRoutes();
      const routeId = totalRoutes - 1n;
      
      return { 
        success: true, 
        routeId: routeId.toString(), 
        receipt
      };
    } catch (err) {
      console.error('Create route error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Get all active routes
  const getActiveRoutes = useCallback(async () => {
    if (!provider) return [];
    
    try {
      const contract = new ethers.Contract(
        CONTRACTS.SHIPPING_ROUTES,
        ShippingRoutesABI.abi,
        provider
      );
      
      const activeRouteIds = await contract.getActiveRoutes();
      const routes = [];
      
      for (const routeId of activeRouteIds) {
        try {
          const route = await contract.getRoute(routeId);
          const ports = await contract.getRoutePorts(routeId);
          
          // FIXED: Call getRouteCampaigns to get assigned campaigns
          const assignedCampaignsRaw = await contract.getRouteCampaigns(routeId);
          const assignedCampaigns = assignedCampaignsRaw
            .map(id => id.toString())
            .filter(id => id !== '0' && id !== '' && parseInt(id) !== 0);
          
          console.log(`Route ${routeId} - Assigned campaigns from getRouteCampaigns:`, assignedCampaigns);
          
          routes.push({
            id: routeId.toString(),
            shipId: route[0],
            shipName: route[1],
            description: route[2],
            departurePort: route[3],
            capacity: Number(route[4]), // containerCapacity
            refrigerationType: Number(route[5]), // refrigeration
            status: Number(route[6]), // status
            currentLocation: route[7],
            assignedCampaigns: assignedCampaigns,
            ports: ports.map(port => ({
              name: port[0],
              code: port[1],
              country: port[2],
              arrivalTime: new Date(Number(port[3]) * 1000),
              visited: port[4],
            })),
          });
        } catch (err) {
          console.error(`Error fetching route ${routeId}:`, err);
        }
      }
      
      return routes;
    } catch (err) {
      console.error('Error fetching active routes:', err);
      return [];
    }
  }, [provider]);

  // Get single route
  const getRoute = useCallback(async (routeId) => {
    if (!provider) return null;
    
    try {
      const contract = new ethers.Contract(
        CONTRACTS.SHIPPING_ROUTES,
        ShippingRoutesABI.abi,
        provider
      );
      
      const route = await contract.getRoute(routeId);
      const ports = await contract.getRoutePorts(routeId);
      
      // FIXED: Call getRouteCampaigns to get assigned campaigns
      const assignedCampaignsRaw = await contract.getRouteCampaigns(routeId);
      const assignedCampaigns = assignedCampaignsRaw
        .map(id => id.toString())
        .filter(id => id !== '0' && id !== '' && parseInt(id) !== 0);
      
      return {
        id: routeId,
        shipId: route[0],
        shipName: route[1],
        description: route[2],
        departurePort: route[3],
        capacity: Number(route[4]), // containerCapacity
        refrigerationType: Number(route[5]), // refrigeration
        status: Number(route[6]), // status
        currentLocation: route[7],
        assignedCampaigns: assignedCampaigns,
        ports: ports.map(port => ({
          name: port[0],
          code: port[1],
          country: port[2],
          arrivalTime: new Date(Number(port[3]) * 1000),
          visited: port[4],
        })),
      };
    } catch (err) {
      console.error('Error fetching route:', err);
      return null;
    }
  }, [provider]);

  // Assign campaign to route
  const assignCampaignToRoute = useCallback(async (
    campaignId,
    routeId,
    containerCount,
    requiresRefrigeration,
    notes
  ) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      
      const tx = await contract.assignCampaignToRoute(
        campaignId,
        routeId,
        containerCount,
        requiresRefrigeration,
        notes,
        {
          maxFeePerGas: ethers.parseUnits("2", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
        }
      );
      
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Update route status
  const updateRouteStatus = useCallback(async (routeId, status, location) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.updateRouteStatus(routeId, status, location, {
        maxFeePerGas: ethers.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
      });
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Mark port as visited
  const markPortVisited = useCallback(async (routeId, portIndex) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.markPortVisited(routeId, portIndex, {
        maxFeePerGas: ethers.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
      });
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Complete route
  const completeRoute = useCallback(async (routeId) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.completeRoute(routeId, {
        maxFeePerGas: ethers.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
      });
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  return {
    loading,
    error,
    createRoute,
    getActiveRoutes,
    getRoute,
    assignCampaignToRoute,
    updateRouteStatus,
    markPortVisited,
    completeRoute,
  };
}
