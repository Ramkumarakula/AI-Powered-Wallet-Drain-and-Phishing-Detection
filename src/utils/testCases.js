// src/utils/testCases.js

export const DEMO_PAYLOADS = [
  {
    id: 'nft_drainer',
    name: "NFT Collection Drainer",
    description: "Calls setApprovalForAll(operator, true) to take control of all NFTs.",
    // Selector 0xa22cb465 + encoded target address + true (1)
    hex: "0xa22cb46500000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976f0000000000000000000000000000000000000000000000000000000000000001",
    target: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
  },
  {
    id: 'token_drainer',
    name: "Unlimited ERC-20 Approval",
    description: "Calls approve() with MaxUint256 to allow infinite spending of tokens.",
    // Selector 0x095ea7b3 + target + ffffffff...
    hex: "0x095ea7b300000000000000000000000071c7656ec7ab88b098defb751b7401b5f6d8976ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    target: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
  },
  {
    id: 'safe_tx',
    name: "Standard Eth Transfer",
    description: "A normal, safe transfer with no dangerous contract interactions.",
    hex: "0x",
    target: "0x95222290DD307809764693113D29a30F46b1219F"
  }
];