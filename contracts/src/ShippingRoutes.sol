// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ShippingRoutes
 * @notice Manages shipping routes and tracks campaigns through their journey
 * @dev Integrates with GroupPurchasing to track product shipments
 */
contract ShippingRoutes is Ownable {
    
    // Enums
    enum RefrigerationType {
        None,
        Refrigerated,
        Frozen,
        Both
    }
    
    enum ShipStatus {
        InPort,          // Docked at port
        AtSea,           // Currently sailing
        ArrivedAtPort,   // Arrived at a destination port
        Delayed,         // Delayed in transit
        Completed        // Route completed
    }
    
    // Structs
    struct Port {
        string portName;
        string portCode;      // e.g., "KIN" for Kingston
        string country;
        uint256 arrivalTime;  // Expected or actual arrival timestamp
        bool visited;         // Whether ship has visited this port
    }
    
    struct ShippingRoute {
        uint256 routeId;
        string shipId;
        string shipName;
        string description;
        string departurePort;
        Port[] destinationPorts;
        uint256 containerCapacity;
        RefrigerationType refrigeration;
        ShipStatus status;
        uint256 currentPortIndex;  // Current position in route
        uint256 departureTime;
        uint256 lastUpdateTime;
        string currentLocation;    // GPS coordinates or location description
        bool active;
        address creator;
    }
    
    struct CampaignShipment {
        uint256 campaignId;
        uint256 routeId;
        uint256 containerCount;
        bool requiresRefrigeration;
        uint256 assignedTime;
        string notes;
    }
    
    // State variables
    uint256 private nextRouteId;
    mapping(uint256 => ShippingRoute) public routes;
    mapping(uint256 => uint256[]) public routeToCampaigns;  // routeId => campaignIds[]
    mapping(uint256 => CampaignShipment) public campaignShipments;  // campaignId => shipment
    mapping(address => uint256[]) public userToCampaigns;  // Track user's campaigns
    uint256[] public activeRoutes;
    
    // Reference to GroupPurchasing contract
    address public groupPurchasingContract;
    
    // Events
    event RouteCreated(
        uint256 indexed routeId,
        string shipId,
        string shipName,
        address indexed creator
    );
    
    event RouteUpdated(
        uint256 indexed routeId,
        ShipStatus status,
        string location
    );
    
    event CampaignAssigned(
        uint256 indexed campaignId,
        uint256 indexed routeId,
        uint256 containerCount
    );
    
    event PortVisited(
        uint256 indexed routeId,
        uint256 portIndex,
        string portName,
        uint256 timestamp
    );
    
    event RouteCompleted(
        uint256 indexed routeId,
        uint256 timestamp
    );
    
    event LocationUpdated(
        uint256 indexed routeId,
        string location,
        uint256 timestamp
    );
    
    constructor(address _groupPurchasingContract) Ownable(msg.sender) {
        groupPurchasingContract = _groupPurchasingContract;
        nextRouteId = 1;
    }
    
    /**
     * @notice Create a new shipping route
     */
    function createRoute(
        string memory _shipId,
        string memory _shipName,
        string memory _description,
        string memory _departurePort,
        string[] memory _portNames,
        string[] memory _portCodes,
        string[] memory _countries,
        uint256[] memory _arrivalTimes,
        uint256 _containerCapacity,
        RefrigerationType _refrigeration
    ) external returns (uint256) {
        require(_portNames.length > 0, "Must have at least one destination");
        require(_portNames.length == _portCodes.length, "Port data mismatch");
        require(_portNames.length == _countries.length, "Port data mismatch");
        require(_portNames.length == _arrivalTimes.length, "Port data mismatch");
        
        uint256 routeId = nextRouteId++;
        ShippingRoute storage route = routes[routeId];
        
        route.routeId = routeId;
        route.shipId = _shipId;
        route.shipName = _shipName;
        route.description = _description;
        route.departurePort = _departurePort;
        route.containerCapacity = _containerCapacity;
        route.refrigeration = _refrigeration;
        route.status = ShipStatus.InPort;
        route.currentPortIndex = 0;
        route.departureTime = block.timestamp;
        route.lastUpdateTime = block.timestamp;
        route.currentLocation = _departurePort;
        route.active = true;
        route.creator = msg.sender;
        
        // Add destination ports
        for (uint256 i = 0; i < _portNames.length; i++) {
            route.destinationPorts.push(Port({
                portName: _portNames[i],
                portCode: _portCodes[i],
                country: _countries[i],
                arrivalTime: _arrivalTimes[i],
                visited: false
            }));
        }
        
        activeRoutes.push(routeId);
        
        emit RouteCreated(routeId, _shipId, _shipName, msg.sender);
        
        return routeId;
    }
    
    /**
     * @notice Assign a campaign to a shipping route
     */
    function assignCampaignToRoute(
        uint256 _campaignId,
        uint256 _routeId,
        uint256 _containerCount,
        bool _requiresRefrigeration,
        string memory _notes
    ) external {
        require(routes[_routeId].active, "Route not active");
        require(campaignShipments[_campaignId].routeId == 0, "Campaign already assigned");
        
        ShippingRoute storage route = routes[_routeId];
        
        // Check refrigeration compatibility
        if (_requiresRefrigeration) {
            require(
                route.refrigeration != RefrigerationType.None,
                "Route does not support refrigeration"
            );
        }
        
        // Check capacity (simplified - just check total)
        uint256 totalAssigned = 0;
        uint256[] storage assignedCampaigns = routeToCampaigns[_routeId];
        for (uint256 i = 0; i < assignedCampaigns.length; i++) {
            totalAssigned += campaignShipments[assignedCampaigns[i]].containerCount;
        }
        require(totalAssigned + _containerCount <= route.containerCapacity, "Insufficient capacity");
        
        // Create shipment record
        campaignShipments[_campaignId] = CampaignShipment({
            campaignId: _campaignId,
            routeId: _routeId,
            containerCount: _containerCount,
            requiresRefrigeration: _requiresRefrigeration,
            assignedTime: block.timestamp,
            notes: _notes
        });
        
        routeToCampaigns[_routeId].push(_campaignId);
        userToCampaigns[msg.sender].push(_campaignId);
        
        emit CampaignAssigned(_campaignId, _routeId, _containerCount);
    }
    
    /**
     * @notice Update ship status and location
     */
    function updateRouteStatus(
        uint256 _routeId,
        ShipStatus _status,
        string memory _location
    ) external {
        ShippingRoute storage route = routes[_routeId];
        require(route.active, "Route not active");
        require(msg.sender == route.creator || msg.sender == owner(), "Not authorized");
        
        route.status = _status;
        route.currentLocation = _location;
        route.lastUpdateTime = block.timestamp;
        
        emit RouteUpdated(_routeId, _status, _location);
        emit LocationUpdated(_routeId, _location, block.timestamp);
    }
    
    /**
     * @notice Mark a port as visited
     */
    function markPortVisited(uint256 _routeId, uint256 _portIndex) external {
        ShippingRoute storage route = routes[_routeId];
        require(route.active, "Route not active");
        require(msg.sender == route.creator || msg.sender == owner(), "Not authorized");
        require(_portIndex < route.destinationPorts.length, "Invalid port index");
        
        Port storage port = route.destinationPorts[_portIndex];
        require(!port.visited, "Port already visited");
        
        port.visited = true;
        route.currentPortIndex = _portIndex;
        route.status = ShipStatus.ArrivedAtPort;
        route.currentLocation = port.portName;
        route.lastUpdateTime = block.timestamp;
        
        emit PortVisited(_routeId, _portIndex, port.portName, block.timestamp);
    }
    
    /**
     * @notice Complete a route
     */
    function completeRoute(uint256 _routeId) external {
        ShippingRoute storage route = routes[_routeId];
        require(route.active, "Route not active");
        require(msg.sender == route.creator || msg.sender == owner(), "Not authorized");
        
        route.status = ShipStatus.Completed;
        route.active = false;
        route.lastUpdateTime = block.timestamp;
        
        // Remove from active routes
        for (uint256 i = 0; i < activeRoutes.length; i++) {
            if (activeRoutes[i] == _routeId) {
                activeRoutes[i] = activeRoutes[activeRoutes.length - 1];
                activeRoutes.pop();
                break;
            }
        }
        
        emit RouteCompleted(_routeId, block.timestamp);
    }
    
    /**
     * @notice Get all campaigns assigned to a route
     */
    function getRouteCampaigns(uint256 _routeId) external view returns (uint256[] memory) {
        return routeToCampaigns[_routeId];
    }
    
    /**
     * @notice Get all active routes
     */
    function getActiveRoutes() external view returns (uint256[] memory) {
        return activeRoutes;
    }
    
    /**
     * @notice Get route details
     */
    function getRoute(uint256 _routeId) external view returns (
        string memory shipId,
        string memory shipName,
        string memory description,
        string memory departurePort,
        uint256 containerCapacity,
        RefrigerationType refrigeration,
        ShipStatus status,
        string memory currentLocation,
        uint256 lastUpdateTime,
        bool active
    ) {
        ShippingRoute storage route = routes[_routeId];
        return (
            route.shipId,
            route.shipName,
            route.description,
            route.departurePort,
            route.containerCapacity,
            route.refrigeration,
            route.status,
            route.currentLocation,
            route.lastUpdateTime,
            route.active
        );
    }
    
    /**
     * @notice Get destination ports for a route
     */
    function getRoutePorts(uint256 _routeId) external view returns (Port[] memory) {
        return routes[_routeId].destinationPorts;
    }
    
    /**
     * @notice Get campaign shipment details
     */
    function getCampaignShipment(uint256 _campaignId) external view returns (
        uint256 routeId,
        uint256 containerCount,
        bool requiresRefrigeration,
        uint256 assignedTime,
        string memory notes
    ) {
        CampaignShipment storage shipment = campaignShipments[_campaignId];
        return (
            shipment.routeId,
            shipment.containerCount,
            shipment.requiresRefrigeration,
            shipment.assignedTime,
            shipment.notes
        );
    }
    
    /**
     * @notice Get campaigns for a user (for notifications)
     */
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userToCampaigns[_user];
    }
    
    /**
     * @notice Get total number of routes
     */
    function getTotalRoutes() external view returns (uint256) {
        return nextRouteId - 1;
    }
    
    /**
     * @notice Update GroupPurchasing contract address
     */
    function setGroupPurchasingContract(address _contract) external onlyOwner {
        groupPurchasingContract = _contract;
    }
}
