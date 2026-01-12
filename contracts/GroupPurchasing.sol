// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GroupPurchasing is Ownable {
    IERC20 public immutable USDC;

    enum CampaignType { PRODUCT, CONTAINER }
    enum Direction { INBOUND, OUTBOUND }
    enum CampaignStatus { ACTIVE, FUNDED, CANCELLED, COMPLETED }
    
    struct ContainerRequirements {
        uint8 containerType;
        int16 minTempCelsius;
        int16 maxTempCelsius;
        uint256 maxWeightKg;
        uint256 currentWeightKg;
        bool requiresVentilation;
        bool requiresRefrigeration;
    }
    
    struct Campaign {
        address organizer;
        CampaignType campaignType;
        Direction direction;
        string productName;
        string productDescription;
        uint256 minOrderQuantity;
        uint256 currentQuantity;
        uint256 pricePerUnit;
        string unit;
        ContainerRequirements containerReqs;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        CampaignStatus status;
        uint256 createdAt;
        uint256 participantCount;
        string originPort;
        string destinationPort;
    }
    
    struct Commitment {
        uint256 quantity;
        uint256 payment;
        string shippingAddress;
    }
    
    uint256 public campaignCounter;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => Commitment)) public commitments;
    mapping(uint256 => address[]) public campaignParticipants;
    
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed organizer,
        CampaignType campaignType,
        Direction direction,
        string productName,
        uint256 targetAmount,
        uint256 deadline,
        string originPort,
        string destinationPort
    );
    
    event ProductCommitmentAdded(
        uint256 indexed campaignId,
        address indexed participant,
        uint256 quantity,
        uint256 payment
    );
    
    event CampaignStatusUpdated(
        uint256 indexed campaignId,
        CampaignStatus status
    );
    
    constructor(address _usdc) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
    }
    
    // FIXED: Added _targetAmount parameter
    function createSingleProductCampaign(
        string memory _productName,
        string memory _productDescription,
        uint256 _minOrderQuantity,
        uint256 _pricePerUnit,
        string memory _unit,
        uint256 _targetAmount,  // ADDED THIS
        uint256 _deadline
    ) public returns (uint256) {
        require(_minOrderQuantity > 0, "Min order must be greater than 0");
        require(_pricePerUnit > 0, "Price must be greater than 0");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        uint256 campaignId = campaignCounter++;
        
        Campaign storage campaign = campaigns[campaignId];
        campaign.organizer = msg.sender;
        campaign.campaignType = CampaignType.PRODUCT;
        campaign.direction = Direction.INBOUND;
        campaign.productName = _productName;
        campaign.productDescription = _productDescription;
        campaign.minOrderQuantity = _minOrderQuantity;
        campaign.pricePerUnit = _pricePerUnit;
        campaign.unit = _unit;
        campaign.targetAmount = _targetAmount;
        campaign.deadline = _deadline;
        campaign.status = CampaignStatus.ACTIVE;
        campaign.createdAt = block.timestamp;
        campaign.originPort = "";
        campaign.destinationPort = "";
        
        emit CampaignCreated(
            campaignId,
            msg.sender,
            CampaignType.PRODUCT,
            Direction.INBOUND,
            _productName,
            _targetAmount,
            _deadline,
            "",
            ""
        );
        
        return campaignId;
    }
    
    function createContainerCampaign(
        string memory _productName,
        string memory _productDescription,
        Direction _direction,
        string memory _originPort,
        string memory _destinationPort,
        ContainerRequirements memory _containerReqs,
        uint256 _targetAmount,
        uint256 _deadline
    ) public returns (uint256) {
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(bytes(_originPort).length > 0, "Origin port required");
        require(bytes(_destinationPort).length > 0, "Destination port required");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        uint256 campaignId = campaignCounter++;
        
        Campaign storage campaign = campaigns[campaignId];
        campaign.organizer = msg.sender;
        campaign.campaignType = CampaignType.CONTAINER;
        campaign.direction = _direction;
        campaign.productName = _productName;
        campaign.productDescription = _productDescription;
        campaign.containerReqs = _containerReqs;
        campaign.targetAmount = _targetAmount;
        campaign.deadline = _deadline;
        campaign.status = CampaignStatus.ACTIVE;
        campaign.createdAt = block.timestamp;
        campaign.originPort = _originPort;
        campaign.destinationPort = _destinationPort;
        
        emit CampaignCreated(
            campaignId,
            msg.sender,
            CampaignType.CONTAINER,
            _direction,
            _productName,
            _targetAmount,
            _deadline,
            _originPort,
            _destinationPort
        );
        
        return campaignId;
    }
    
    function joinSingleProductCampaign(
        uint256 _campaignId,
        uint256 _quantity,
        string memory _shippingAddress
    ) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.ACTIVE, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        uint256 payment = campaign.pricePerUnit * _quantity;
        require(payment > 0, "Invalid payment amount");
        
        require(
            USDC.transferFrom(msg.sender, address(this), payment),
            "USDC transfer failed"
        );
        
        if (commitments[_campaignId][msg.sender].payment == 0) {
            campaignParticipants[_campaignId].push(msg.sender);
            campaign.participantCount++;
        }
        
        commitments[_campaignId][msg.sender].quantity += _quantity;
        commitments[_campaignId][msg.sender].payment += payment;
        commitments[_campaignId][msg.sender].shippingAddress = _shippingAddress;
        
        campaign.currentQuantity += _quantity;
        campaign.currentAmount += payment;
        
        emit ProductCommitmentAdded(_campaignId, msg.sender, _quantity, payment);
        
        if (campaign.currentAmount >= campaign.targetAmount) {
            campaign.status = CampaignStatus.FUNDED;
            emit CampaignStatusUpdated(_campaignId, CampaignStatus.FUNDED);
        }
    }
    
    function joinContainerCampaign(
        uint256 _campaignId,
        uint256 _payment,
        uint256 _weightKg,
        string memory _shippingAddress
    ) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.ACTIVE, "Campaign is not active");
        require(campaign.campaignType == CampaignType.CONTAINER, "Not a container campaign");
        require(campaign.direction == Direction.INBOUND, "Not an inbound campaign");
        require(block.timestamp < campaign.deadline, "Campaign deadline passed");
        require(_payment > 0, "Payment must be greater than 0");
        require(
            campaign.containerReqs.currentWeightKg + _weightKg <= campaign.containerReqs.maxWeightKg,
            "Exceeds container weight capacity"
        );
        
        require(
            USDC.transferFrom(msg.sender, address(this), _payment),
            "USDC transfer failed"
        );
        
        if (commitments[_campaignId][msg.sender].payment == 0) {
            campaignParticipants[_campaignId].push(msg.sender);
            campaign.participantCount++;
        }
        
        commitments[_campaignId][msg.sender].quantity += _weightKg;
        commitments[_campaignId][msg.sender].payment += _payment;
        commitments[_campaignId][msg.sender].shippingAddress = _shippingAddress;
        
        campaign.containerReqs.currentWeightKg += _weightKg;
        campaign.currentAmount += _payment;
        
        emit ProductCommitmentAdded(_campaignId, msg.sender, _weightKg, _payment);
        
        if (campaign.currentAmount >= campaign.targetAmount) {
            campaign.status = CampaignStatus.FUNDED;
            emit CampaignStatusUpdated(_campaignId, CampaignStatus.FUNDED);
        }
    }
    
    function cancelCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.organizer == msg.sender, "Only organizer can cancel");
        require(campaign.status == CampaignStatus.ACTIVE, "Campaign is not active");
        
        campaign.status = CampaignStatus.CANCELLED;
        emit CampaignStatusUpdated(_campaignId, CampaignStatus.CANCELLED);
        
        address[] memory participants = campaignParticipants[_campaignId];
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 refundAmount = commitments[_campaignId][participant].payment;
            if (refundAmount > 0) {
                require(USDC.transfer(participant, refundAmount), "Refund failed");
            }
        }
    }
    
    function getCampaign(uint256 _campaignId) public view returns (
        address organizer,
        CampaignType campaignType,
        Direction direction,
        string memory productName,
        string memory productDescription,
        uint256 minOrderQuantity,
        uint256 currentQuantity,
        uint256 pricePerUnit,
        string memory unit,
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 deadline,
        CampaignStatus status,
        uint256 createdAt,
        uint256 participantCount,
        string memory originPort,
        string memory destinationPort
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.organizer,
            campaign.campaignType,
            campaign.direction,
            campaign.productName,
            campaign.productDescription,
            campaign.minOrderQuantity,
            campaign.currentQuantity,
            campaign.pricePerUnit,
            campaign.unit,
            campaign.targetAmount,
            campaign.currentAmount,
            campaign.deadline,
            campaign.status,
            campaign.createdAt,
            campaign.participantCount,
            campaign.originPort,
            campaign.destinationPort
        );
    }
    
    function getContainerRequirements(uint256 _campaignId) public view returns (ContainerRequirements memory) {
        return campaigns[_campaignId].containerReqs;
    }
    
    function getCommitment(uint256 _campaignId, address _participant) public view returns (
        uint256 quantity,
        uint256 payment,
        string memory shippingAddress
    ) {
        Commitment storage commitment = commitments[_campaignId][_participant];
        return (commitment.quantity, commitment.payment, commitment.shippingAddress);
    }
    
    function getParticipants(uint256 _campaignId) public view returns (address[] memory) {
        return campaignParticipants[_campaignId];
    }
    
    function getCampaignProgress(uint256 _campaignId) public view returns (
        uint256 currentAmount,
        uint256 targetAmount,
        uint256 percentComplete,
        uint256 participantCount
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        uint256 percent = 0;
        if (campaign.targetAmount > 0) {
            percent = (campaign.currentAmount * 100) / campaign.targetAmount;
        }
        return (
            campaign.currentAmount,
            campaign.targetAmount,
            percent,
            campaign.participantCount
        );
    }
    
    function getTotalCampaigns() public view returns (uint256) {
        return campaignCounter;
    }
    
    function exists(uint256 _campaignId) public view returns (bool) {
        return _campaignId < campaignCounter;
    }
    
    function getCampaignsByDirection(Direction _direction, uint256 _limit) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](_limit);
        uint256 count = 0;
        
        for (uint256 i = 0; i < campaignCounter && count < _limit; i++) {
            if (campaigns[i].direction == _direction && campaigns[i].status == CampaignStatus.ACTIVE) {
                result[count] = i;
                count++;
            }
        }
        
        uint256[] memory trimmed = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            trimmed[i] = result[i];
        }
        
        return trimmed;
    }
    
    function getInboundCampaigns(uint256 _limit) public view returns (uint256[] memory) {
        return getCampaignsByDirection(Direction.INBOUND, _limit);
    }
    
    function getBackhaulCampaigns(uint256 _limit) public view returns (uint256[] memory) {
        return getCampaignsByDirection(Direction.OUTBOUND, _limit);
    }
}
