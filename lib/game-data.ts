export interface Question {
  id: string;
  level: 'easy' | 'medium' | 'hard' | 'expert';
  story: string;
  question: string;
  answer: string;
  hints?: string[];
  maxTime: number; // seconds
}

export const QUESTION_BANK: Question[] = [
  {
    id: 'e1',
    level: 'easy',
    story: 'The first cipher fragment reveals ancient symbols carved into digital stone...',
    question: 'What is the native token of the Aptos blockchain?',
    answer: 'apt',
    hints: ['It\'s a three-letter abbreviation'],
    maxTime: 30
  },
  {
    id: 'e2',
    level: 'easy',
    story: 'Whispers in the code speak of a wallet that bears the name of stone...',
    question: 'What is the most popular wallet for Aptos ecosystem?',
    answer: 'petra',
    hints: ['Named after an ancient city carved in stone'],
    maxTime: 30
  },
  {
    id: 'e3',
    level: 'easy',
    story: 'The phantom ledger speaks of a language that flows like water...',
    question: 'What programming language is used for smart contracts on Aptos?',
    answer: 'move',
    hints: ['It suggests motion and fluidity'],
    maxTime: 30
  },
  {
    id: 'e4',
    level: 'easy',
    story: 'In the depths of the blockchain, a consensus mechanism emerges...',
    question: 'What consensus mechanism does Aptos use?',
    answer: 'proof-of-stake',
    hints: ['Not proof-of-work, but proof of something else'],
    maxTime: 30
  },
  {
    id: 'e5',
    level: 'easy',
    story: 'The genesis speaks of founders who once walked among giants...',
    question: 'Aptos was founded by former employees of which company?',
    answer: 'meta',
    hints: ['Formerly known as Facebook'],
    maxTime: 30
  },
  {
    id: 'e6',
    level: 'easy',
    story: 'The archive reveals the birth year of this phantom network...',
    question: 'In what year was Aptos mainnet launched?',
    answer: '2022',
    hints: ['Between 2020 and 2025'],
    maxTime: 30
  },
  {
    id: 'e7',
    level: 'easy',
    story: 'The ledger whispers of a marketplace where digital treasures are traded...',
    question: 'What is the primary NFT marketplace on Aptos?',
    answer: 'topaz',
    hints: ['Named after a precious gemstone'],
    maxTime: 30
  },
  {
    id: 'e8',
    level: 'easy',
    story: 'The code reveals a bridge that spans between realms...',
    question: 'What is the cross-chain bridge protocol commonly used with Aptos?',
    answer: 'wormhole',
    hints: ['Named after a theoretical physics concept'],
    maxTime: 30
  },
  {
    id: 'e9',
    level: 'easy',
    story: 'In the phantom depths, liquidity flows through a familiar protocol...',
    question: 'What is a popular DEX (Decentralized Exchange) on Aptos?',
    answer: 'pancakeswap',
    hints: ['Breakfast food protocol that exists on multiple chains'],
    maxTime: 30
  },
  {
    id: 'e10',
    level: 'easy',
    story: 'The ancient texts speak of staking pools and yield generation...',
    question: 'What is a popular liquid staking protocol on Aptos?',
    answer: 'tortuga',
    hints: ['Named after a slow, steady creature'],
    maxTime: 30
  },
  {
    id: 'e11',
    level: 'easy',
    story: 'The cipher reveals naming conventions of the digital realm...',
    question: 'What is the Aptos name service called?',
    answer: 'ans',
    hints: ['Aptos Name Service abbreviated'],
    maxTime: 30
  },
  {
    id: 'e12',
    level: 'easy',
    story: 'The phantom ledger speaks of monetary policy encoded in stone...',
    question: 'What is the maximum supply of APT tokens?',
    answer: 'unlimited',
    hints: ['There is no hard cap'],
    maxTime: 30
  },
  {
    id: 'e13',
    level: 'easy',
    story: 'The digital archaeology reveals founding principles...',
    question: 'Aptos was designed to solve what blockchain trilemma aspect?',
    answer: 'scalability',
    hints: ['Not security or decentralization, but the third pillar'],
    maxTime: 30
  },
  {
    id: 'e14',
    level: 'easy',
    story: 'The phantom network whispers of transaction finality...',
    question: 'What is the average block time on Aptos?',
    answer: '4',
    hints: ['A single digit number of seconds'],
    maxTime: 30
  },
  {
    id: 'e15',
    level: 'easy',
    story: 'The ledger reveals the smallest denomination of value...',
    question: 'What is the smallest unit of APT called?',
    answer: 'octas',
    hints: ['Named after a mathematical base system'],
    maxTime: 30
  },

  // Medium Level Questions (15 questions)
  {
    id: 'm1',
    level: 'medium',
    story: 'Deeper in the phantom ledger, protocols emerge that mimic traditional finance...',
    question: 'What is the leading lending protocol on Aptos?',
    answer: 'econia',
    hints: ['Named after an economic term'],
    maxTime: 45
  },
  {
    id: 'm2',
    level: 'medium',
    story: 'The cipher speaks of a wallet that bridges the gap between browser and mobile...',
    question: 'Besides Petra, what is another popular Aptos wallet?',
    answer: 'pontem',
    hints: ['Latin word meaning bridge'],
    maxTime: 45
  },
  {
    id: 'm3',
    level: 'medium',
    story: 'In the depths of Move, a unique feature prevents common vulnerabilities...',
    question: 'What Move feature prevents reentrancy attacks?',
    answer: 'resources',
    hints: ['A fundamental Move concept that ensures linear logic'],
    maxTime: 45
  },
  {
    id: 'm4',
    level: 'medium',
    story: 'The phantom network reveals its consensus innovation...',
    question: 'What is the name of Aptos\' consensus algorithm?',
    answer: 'aptosbft',
    hints: ['Combines the network name with a consensus term'],
    maxTime: 45
  },
  {
    id: 'm5',
    level: 'medium',
    story: 'The ledger speaks of parallel execution and its implementation...',
    question: 'What is Aptos\' parallel execution engine called?',
    answer: 'block-smt',
    hints: ['Combines block processing with a tree structure'],
    maxTime: 45
  },
  {
    id: 'm6',
    level: 'medium',
    story: 'The cipher reveals the architecture of account abstraction...',
    question: 'What feature allows flexible transaction authentication on Aptos?',
    answer: 'keyless',
    hints: ['Removes the need for traditional private key management'],
    maxTime: 45
  },
  {
    id: 'm7',
    level: 'medium',
    story: 'Deep in the protocol, a DeFi primitive enables complex trading...',
    question: 'What is the order book DEX protocol on Aptos?',
    answer: 'econia',
    hints: ['Same as the lending protocol, it\'s multi-functional'],
    maxTime: 45
  },
  {
    id: 'm8',
    level: 'medium',
    story: 'The phantom ledger whispers of yield strategies and farming...',
    question: 'What is a popular yield farming protocol on Aptos?',
    answer: 'thala',
    hints: ['Named after a concept from ancient Indian philosophy'],
    maxTime: 45
  },
  {
    id: 'm9',
    level: 'medium',
    story: 'The digital realm speaks of identity and reputation systems...',
    question: 'What is the soul-bound token standard on Aptos?',
    answer: 'aptos-token',
    hints: ['The native token standard of the network'],
    maxTime: 45
  },
  {
    id: 'm10',
    level: 'medium',
    story: 'In the depths of the Move VM, optimization algorithms emerge...',
    question: 'What is the transaction scheduling algorithm in Aptos?',
    answer: 'parallel-execution',
    hints: ['Enables concurrent processing of transactions'],
    maxTime: 45
  },
  {
    id: 'm11',
    level: 'medium',
    story: 'The cipher reveals the foundation\'s governance structure...',
    question: 'What is the name of the Aptos foundation?',
    answer: 'aptos-foundation',
    hints: ['Simply combines the network name with foundation'],
    maxTime: 45
  },
  {
    id: 'm12',
    level: 'medium',
    story: 'The phantom network speaks of its testnet\'s ancient name...',
    question: 'What was the name of Aptos\' incentivized testnet?',
    answer: 'ait',
    hints: ['Aptos Incentivized Testnet abbreviated'],
    maxTime: 45
  },
  {
    id: 'm13',
    level: 'medium',
    story: 'Deep in the protocol, oracles feed truth to the phantom ledger...',
    question: 'What is a popular oracle protocol on Aptos?',
    answer: 'pyth',
    hints: ['Named after an ancient Greek oracle site'],
    maxTime: 45
  },
  {
    id: 'm14',
    level: 'medium',
    story: 'The ledger reveals its approach to MEV protection...',
    question: 'What feature helps prevent MEV on Aptos?',
    answer: 'fairness',
    hints: ['A design principle built into the consensus'],
    maxTime: 45
  },
  {
    id: 'm15',
    level: 'medium',
    story: 'The cipher speaks of cross-chain communication protocols...',
    question: 'What is the primary interoperability protocol for Aptos?',
    answer: 'layerzero',
    hints: ['A protocol that enables omnichain connectivity'],
    maxTime: 45
  },

  // Hard Level Questions (15 questions)
  {
    id: 'h1',
    level: 'hard',
    story: 'The phantom ledger\'s deepest secrets reveal advanced cryptographic primitives...',
    question: 'What cryptographic signature scheme does Aptos primarily use?',
    answer: 'ed25519',
    hints: ['An Edwards curve signature scheme'],
    maxTime: 60
  },
  {
    id: 'h2',
    level: 'hard',
    story: 'In the Move language\'s core, a safety mechanism prevents double-spending...',
    question: 'What Move concept ensures resources cannot be copied or dropped?',
    answer: 'linear-types',
    hints: ['A type system property that ensures one-time usage'],
    maxTime: 60
  },
  {
    id: 'h3',
    level: 'hard',
    story: 'The phantom network\'s consensus reveals its Byzantine fault tolerance...',
    question: 'What percentage of validators can be Byzantine in Aptos BFT?',
    answer: '33',
    hints: ['One-third minus epsilon is the theoretical maximum'],
    maxTime: 60
  },
  {
    id: 'h4',
    level: 'hard',
    story: 'Deep in the execution layer, a novel approach to state management emerges...',
    question: 'What data structure does Aptos use for state storage?',
    answer: 'merkle-tree',
    hints: ['A cryptographic tree structure for efficient verification'],
    maxTime: 60
  },
  {
    id: 'h5',
    level: 'hard',
    story: 'The cipher reveals the phantom ledger\'s approach to gas optimization...',
    question: 'What is the gas unit used in Aptos transactions?',
    answer: 'gas-units',
    hints: ['The standard unit for computational cost measurement'],
    maxTime: 60
  },
  {
    id: 'h6',
    level: 'hard',
    story: 'In the Move VM\'s architecture, bytecode verification ensures safety...',
    question: 'What is the Move bytecode verifier called?',
    answer: 'move-verifier',
    hints: ['The component responsible for static analysis'],
    maxTime: 60
  },
  {
    id: 'h7',
    level: 'hard',
    story: 'The phantom network\'s parallel execution requires sophisticated ordering...',
    question: 'What algorithm does Aptos use for transaction ordering?',
    answer: 'block-smt',
    hints: ['A sparse merkle tree implementation for blocks'],
    maxTime: 60
  },
  {
    id: 'h8',
    level: 'hard',
    story: 'Deep in the protocol\'s economic model, validator incentives are encoded...',
    question: 'What is the minimum stake required to become an Aptos validator?',
    answer: '1000000',
    hints: ['One million APT tokens'],
    maxTime: 60
  },
  {
    id: 'h9',
    level: 'hard',
    story: 'The cipher speaks of the phantom ledger\'s approach to finality...',
    question: 'What type of finality does Aptos provide?',
    answer: 'instant',
    hints: ['Transactions are final as soon as they\'re committed'],
    maxTime: 60
  },
  {
    id: 'h10',
    level: 'hard',
    story: 'In the Move language\'s type system, generics enable powerful abstractions...',
    question: 'What is the Move equivalent of Solidity\'s mapping?',
    answer: 'table',
    hints: ['A dynamic collection type in Move'],
    maxTime: 60
  },
  {
    id: 'h11',
    level: 'hard',
    story: 'The phantom network\'s account model differs from Ethereum\'s design...',
    question: 'What is unique about Aptos account addresses?',
    answer: 'single-use',
    hints: ['Each account can only be created once'],
    maxTime: 60
  },
  {
    id: 'h12',
    level: 'hard',
    story: 'Deep in the consensus layer, leader rotation ensures decentralization...',
    question: 'How often does leader rotation occur in Aptos?',
    answer: 'every-round',
    hints: ['Leadership changes with each consensus round'],
    maxTime: 60
  },
  {
    id: 'h13',
    level: 'hard',
    story: 'The cipher reveals the phantom ledger\'s approach to upgradeability...',
    question: 'What mechanism allows Move modules to be upgraded?',
    answer: 'compatibility',
    hints: ['Upgrades must maintain backward compatibility'],
    maxTime: 60
  },
  {
    id: 'h14',
    level: 'hard',
    story: 'In the Move prover\'s formal verification, mathematical proofs ensure correctness...',
    question: 'What specification language does the Move prover use?',
    answer: 'mvir',
    hints: ['Move Intermediate Representation'],  
    maxTime: 60
  },
  {
    id: 'h15',
    level: 'hard',
    story: 'The phantom network\'s sharding approach enables infinite scalability...',
    question: 'What is Aptos\' approach to horizontal scaling?',
    answer: 'homogeneous',
    hints: ['All shards have the same capabilities'],
    maxTime: 60
  },

  // Expert Level Questions (15 questions)
  {
    id: 'x1',
    level: 'expert',
    story: 'The deepest secrets of the phantom ledger reveal the architecture of infinity...',
    question: 'What is the theoretical TPS limit of Aptos with optimal sharding?',
    answer: '160000',
    hints: ['One hundred sixty thousand transactions per second'],
    maxTime: 90
  },
  {
    id: 'x2',
    level: 'expert',
    story: 'In the Move language\'s most advanced features, capability-based security emerges...',
    question: 'What Move feature enables fine-grained access control?',
    answer: 'capabilities',
    hints: ['A security model based on unforgeable tokens'],
    maxTime: 90
  },
  {
    id: 'x3',
    level: 'expert',
    story: 'The phantom ledger\'s consensus algorithm implements a novel voting mechanism...',
    question: 'What is the voting mechanism in AptosBFT consensus?',
    answer: 'chained-bft',
    hints: ['A Byzantine fault-tolerant protocol with chaining'],
    maxTime: 90
  },
  {
    id: 'x4',
    level: 'expert',
    story: 'Deep in the cryptographic foundations, hash functions secure the phantom realm...',
    question: 'What hash function does Aptos use for its Merkle trees?',
    answer: 'sha3-256',
    hints: ['The third version of the Secure Hash Algorithm'],
    maxTime: 90
  },
  {
    id: 'x5',
    level: 'expert',
    story: 'The cipher reveals the phantom network\'s approach to state pruning...',
    question: 'What is Aptos\' state pruning strategy called?',
    answer: 'epoch-based',
    hints: ['Pruning occurs at regular epoch intervals'],
    maxTime: 90
  },
  {
    id: 'x6',
    level: 'expert',
    story: 'In the Move VM\'s execution model, a novel approach to resource management emerges...',
    question: 'What is the Move VM\'s approach to memory management?',
    answer: 'ownership',
    hints: ['Based on Rust-like ownership semantics'],
    maxTime: 90
  },
  {
    id: 'x7',
    level: 'expert',
    story: 'The phantom network\'s parallel execution engine implements advanced scheduling...',
    question: 'What scheduling algorithm enables Aptos\' parallel execution?',
    answer: 'software-transactional-memory',
    hints: ['STM-based approach to concurrent execution'],
    maxTime: 90
  },
  {
    id: 'x8',
    level: 'expert',
    story: 'Deep in the protocol\'s economic incentives, a novel staking mechanism emerges...',
    question: 'What is unique about Aptos\' staking reward distribution?',
    answer: 'dynamic',
    hints: ['Rewards adjust based on network participation'],
    maxTime: 90
  },
  {
    id: 'x9',
    level: 'expert',
    story: 'The cipher speaks of the phantom ledger\'s approach to cross-shard communication...',
    question: 'What protocol enables communication between Aptos shards?',
    answer: 'async-messaging',
    hints: ['Asynchronous message passing between shards'],
    maxTime: 90
  },
  {
    id: 'x10',
    level: 'expert',
    story: 'In the Move language\'s formal semantics, mathematical precision defines behavior...',
    question: 'What formal method does Move use for verification?',
    answer: 'boogie',
    hints: ['An intermediate verification language'],
    maxTime: 90
  },
  {
    id: 'x11',
    level: 'expert',
    story: 'The phantom network\'s consensus safety relies on cryptographic assumptions...',
    question: 'What cryptographic assumption underlies Aptos security?',
    answer: 'discrete-logarithm',
    hints: ['The hardness of computing discrete logarithms'],
    maxTime: 90  
  },
  {
    id: 'x12',
    level: 'expert',
    story: 'Deep in the execution layer, a novel approach to gas metering emerges...',
    question: 'What is Aptos\' approach to gas price discovery?',
    answer: 'auction-based',
    hints: ['Market-driven gas price determination'],
    maxTime: 90
  },
  {
    id: 'x13',
    level: 'expert',
    story: 'The cipher reveals the phantom ledger\'s ultimate scalability solution...',
    question: 'What is Aptos\' long-term scaling approach called?',
    answer: 'homogeneous-sharding',
    hints: ['Uniform shard architecture for infinite scale'],
    maxTime: 90
  },
  {
    id: 'x14',
    level: 'expert',
    story: 'In the phantom network\'s governance, mathematical voting ensures decentralization...',
    question: 'What voting mechanism does Aptos governance use?',
    answer: 'quadratic',
    hints: ['Voting power scales as the square root of stake'],
    maxTime: 90
  },
  {
    id: 'x15',
    level: 'expert',
    story: 'The deepest mystery of the phantom ledger lies in its ultimate purpose...',
    question: 'What is the final goal of the Aptos blockchain architecture?',
    answer: 'decentralized-internet',
    hints: ['The infrastructure for a fully decentralized web'],
    maxTime: 90
  }
];

export const LEVEL_CONFIG = {
  easy: { name: 'Initiate', questionsPerLevel: 5, timeMultiplier: 1 },
  medium: { name: 'Acolyte', questionsPerLevel: 5, timeMultiplier: 1.5 },
  hard: { name: 'Adept', questionsPerLevel: 5, timeMultiplier: 2 },
  expert: { name: 'Master', questionsPerLevel: 5, timeMultiplier: 2.5 }
};

export const CRYPTIC_STORY = `
In the year 2025, deep beneath the surface web, whispers speak of a hidden subnet within the Aptos blockchain - the Phantom Ledger. 

This ethereal realm contains encrypted puzzles left by the original architects, each cipher a fragment of ancient digital wisdom. You have been chosen to unlock these secrets, to prove your worthiness in the cryptographic arts.

The Phantom Ledger operates beyond normal consensus, existing in the quantum spaces between blocks. Each question you answer correctly brings you closer to the ultimate truth - the location of the final cipher that holds the key to eternal digital enlightenment.

But beware, seeker of knowledge. You have only three lives, three chances to prove your dedication. Fail, and you will be cast out from the Phantom Ledger forever, your consciousness scattered across the digital void.

The puzzles grow more complex as you ascend through the levels:
- Initiate: Basic knowledge of the Aptos realm
- Acolyte: Deeper understanding of the protocols  
- Adept: Advanced cryptographic concepts
- Master: The ultimate test of your dedication

Time itself works against you. Answer quickly to maximize your score, but think carefully - for wrong answers cost precious life force.

Are you ready to enter the Phantom Ledger and claim your place among the digital enlightened?

The first cipher awaits...
`;

export const FINAL_CIPHER = `
╔═══════════════════════════════════════════════════════════════╗
║                    THE PHANTOM LEDGER                         ║
║                      FINAL CIPHER                             ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  01000011 01101111 01101110 01100111 01110010 01100001       ║
║  01110100 01110101 01101100 01100001 01110100 01101001       ║
║  01101111 01101110 01110011                                   ║
║                                                               ║
║  You have proven yourself worthy of the deepest secrets.      ║
║  The Phantom Ledger recognizes you as a true initiate        ║
║  of the cryptographic arts.                                   ║
║                                                               ║
║  The binary above contains your final message.                ║
║  Decode it to complete your digital enlightenment.            ║
║                                                               ║
║  Your journey in the Phantom Ledger is complete.              ║
║  But remember - this is only the beginning.                   ║
║                                                               ║
║  The blockchain holds infinite mysteries.                     ║
║  Continue seeking. Continue learning.                         ║
║  Continue questioning reality itself.                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

APT Rewards have been calculated based on your performance.
The Phantom Ledger thanks you for your dedication.

May your transactions always confirm.
May your gas fees always be low.
May your private keys always be secure.

- The Architects of the Phantom Ledger
`;