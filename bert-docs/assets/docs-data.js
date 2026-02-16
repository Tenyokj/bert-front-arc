window.BERT_DOCS = [
  {
    slug: "overview",
    group: "Start",
    title: "Overview",
    summary: "What BERT is, what problems it solves, and what is in scope.",
    content: `
      <h1>BERT Protocol Documentation</h1>
      <p class="lead">BERT is an upgradeable DAO voting and grant protocol. It turns proposals into funded outcomes through deterministic state transitions, stake-based voting rounds, and controlled treasury distribution.</p>

      <div>
        <span class="badge">Upgradeable</span>
        <span class="badge">Role-gated</span>
        <span class="badge">On-chain execution</span>
        <span class="badge">The Graph indexed</span>
      </div>

      <h2>Core goals</h2>
      <ul>
        <li>Move from idea submission to funding in one coherent protocol surface.</li>
        <li>Keep decision logic auditable by making critical transitions on-chain.</li>
        <li>Support long-term evolution using proxy upgrades without storage corruption.</li>
        <li>Reward quality participation through reputation and voter progression.</li>
      </ul>

      <h2>Protocol modules</h2>
      <ul>
        <li><strong>IdeaRegistryUpgradeable</strong>: proposal records, statuses, reviews, low-quality marks.</li>
        <li><strong>VotingSystemUpgradeable</strong>: rounds, voting windows, winner resolution.</li>
        <li><strong>FundingPoolUpgradeable</strong>: stake accounting and treasury balance management.</li>
        <li><strong>GrantManagerUpgradeable</strong>: allocation and distribution logic after wins.</li>
        <li><strong>GovernanceTokenUpgradeable (BTK)</strong>: protocol token used in flow mechanics.</li>
        <li><strong>ReputationSystemUpgradeable</strong>: author reputation updates on outcomes.</li>
        <li><strong>VoterProgressionUpgradeable</strong>: progression counters and role unlock criteria.</li>
        <li><strong>RolesRegistryUpgradeable</strong>: central role authority and system role wiring.</li>
        <li><strong>BRTFaucet</strong>: test token distribution for onboarding and QA.</li>
      </ul>

      <div class="callout info">
        <strong>Production note:</strong> docs describe current protocol behavior for the Sepolia deployment listed below.
        Always validate addresses and role wiring before building new integrations.
      </div>
    `,
  },
  {
    slug: "architecture",
    group: "Protocol",
    title: "Architecture",
    summary: "How contracts interact and what data paths are authoritative.",
    content: `
      <h1>Architecture</h1>
      <p class="lead">BERT is a modular architecture where each contract owns a narrow domain. Cross-contract writes are explicit and role-restricted to prevent hidden state authority.</p>

      <h2>Data authority model</h2>
      <ul>
        <li><strong>Live state:</strong> direct contract reads from RPC (viem/wagmi).</li>
        <li><strong>History and analytics:</strong> indexed event projections in The Graph.</li>
        <li><strong>Policy state:</strong> role registry + admin-controlled setters + pause controls.</li>
      </ul>

      <h2>High-level flow</h2>
      <ol>
        <li>User submits idea in <code>IdeaRegistry</code> with initial status <code>Pending</code>.</li>
        <li>Anyone starts round in <code>VotingSystem</code> when idea threshold is met.</li>
        <li>Ideas in the round move to <code>Voting</code> status.</li>
        <li>Participants vote with BTK stake (deposited via <code>FundingPool</code>).</li>
        <li>Round ends; winner is selected and statuses are finalized.</li>
        <li>Reputation and progression updates are applied according to outcome.</li>
        <li>Grant flow can allocate from pool and move idea toward funded/completed lifecycle.</li>
      </ol>

      <h2>Operational control planes</h2>
      <ul>
        <li><strong>Pause plane:</strong> emergency stops for critical write functions.</li>
        <li><strong>Upgrade plane:</strong> per-proxy ProxyAdmin ownership controls implementation upgrades.</li>
        <li><strong>Role plane:</strong> system and functional roles for guarded calls.</li>
      </ul>

      <pre><code>// Example: frontend data strategy
// 1) Read current status directly from RPC
const status = await ideaRegistry.getStatus(ideaId)

// 2) Read historical votes/reviews via subgraph query
const history = await fetch(SUBGRAPH_URL, { method: "POST", body: JSON.stringify({ query }) })</code></pre>
    `,
  },
  {
    slug: "contract-reference",
    group: "Protocol",
    title: "Contract Reference",
    summary: "Key business functions and responsibilities by contract.",
    content: `
      <h1>Contract Reference</h1>
      <p class="lead">This section focuses on high-impact business behavior, not only ABI-level signatures.</p>

      <h2>RolesRegistryUpgradeable</h2>
      <ul>
        <li>Central role source for protocol and system modules.</li>
        <li>Used by other contracts through RolesAware pattern.</li>
        <li>Critical for upgrade/admin/operator access boundaries.</li>
      </ul>

      <h2>IdeaRegistryUpgradeable</h2>
      <ul>
        <li>Stores proposal metadata and canonical proposal status.</li>
        <li>Handles review submission and low-quality marking guards.</li>
        <li>Supports author completion marker when idea reaches funded stage.</li>
      </ul>

      <h2>VotingSystemUpgradeable</h2>
      <ul>
        <li>Creates rounds from pending ideas based on <code>IDEAS_PER_ROUND</code>.</li>
        <li>Enforces window rules and one-vote-per-address-per-round constraints.</li>
        <li>Tracks round totals and chooses winner by highest staked votes.</li>
        <li>On round end, updates idea statuses and triggers reputation/progression hooks.</li>
      </ul>

      <h2>FundingPoolUpgradeable</h2>
      <ul>
        <li>Receives staking deposits for votes.</li>
        <li>Maintains pool balance and protocol reserve accounting.</li>
        <li>Supports admin sync and safe reconciliation controls.</li>
      </ul>

      <h2>GrantManagerUpgradeable</h2>
      <ul>
        <li>Executes payout and distribution logic after idea wins.</li>
        <li>Owns author/protocol share controls through admin setter policy.</li>
        <li>Bridge between voting outcomes and treasury execution.</li>
      </ul>

      <h2>GovernanceTokenUpgradeable (BTK)</h2>
      <ul>
        <li>ERC-20 with protocol-specific minting controls and minter roles.</li>
        <li>Used for staking, pool deposits, and voting participation economics.</li>
      </ul>

      <h2>ReputationSystemUpgradeable & VoterProgressionUpgradeable</h2>
      <ul>
        <li>Reputation adjusts based on win/loss outcomes.</li>
        <li>Progression tracks successful participation and role unlock metrics.</li>
      </ul>

      <h2>BRTFaucet</h2>
      <ul>
        <li>Distributes claim amount with cooldown for test usage.</li>
        <li>Admin can set claim amount, cooldown, and pause faucet.</li>
      </ul>

      <div class="callout warning">
        <strong>Integration tip:</strong> build client-side pre-checks around status and role rules before sending transactions,
        so users get readable errors instead of raw revert payloads.
      </div>
    `,
  },
  {
    slug: "sepolia-addresses",
    group: "Deployment",
    title: "Sepolia Addresses",
    summary: "Current deployed proxy addresses for BERT on Sepolia.",
    content: `
      <h1>Sepolia Deployment Addresses</h1>
      <p class="lead">Deployment source: latest successful proxy deployment and faucet deployment on Sepolia (February 16, 2026). <span class="hl-yellow">Treat this page as the canonical environment snapshot.</span></p>

      <h2>Core proxies</h2>
      <table>
        <thead>
          <tr><th>Contract</th><th>Address</th></tr>
        </thead>
        <tbody>
          <tr><td>RolesRegistryUpgradeable</td><td><code>0xD0BD6093bC008326E522b39eC79c350c44A99db1</code></td></tr>
          <tr><td>ReputationSystemUpgradeable</td><td><code>0x51d08e9871e06763E7f34BCea4D359DC217DC6A5</code></td></tr>
          <tr><td>VoterProgressionUpgradeable</td><td><code>0x4f654ED420Bd2F8EB01060f48b9bE8fAb787c94f</code></td></tr>
          <tr><td>IdeaRegistryUpgradeable</td><td><code>0xFf4F0AEeCe93847d68E0FF169142E64f613850BE</code></td></tr>
          <tr><td>GovernanceTokenUpgradeable (BTK)</td><td><code>0x89F0645551D669aa8813b245266E8c09Bbe0F9c2</code></td></tr>
          <tr><td>FundingPoolUpgradeable</td><td><code>0x822e853dB65B288FE01Ca76Ed6e8B4895070F32D</code></td></tr>
          <tr><td>VotingSystemUpgradeable</td><td><code>0x34B611EFEc9ce93d5443Bfcf1fc7D10640cfb943</code></td></tr>
          <tr><td>GrantManagerUpgradeable</td><td><code>0x0efEF5542f41e705cdf402070268C42473281FEA</code></td></tr>
          <tr><td>BRTFaucet</td><td><code>0xbb28E64127fAa14C77A5021e6a5D307B89a39c70</code></td></tr>
        </tbody>
      </table>

      <h2>Network and endpoints</h2>
      <ul>
        <li>Network: <strong>Sepolia</strong> (chainId <code>11155111</code>)</li>
        <li>RPC in use: <code>https://sepolia.infura.io/v3/552b3927bbd14d158a079e9d4df2a8ca</code></li>
        <li>Subgraph Studio endpoint: <code>https://api.studio.thegraph.com/query/1742046/bert-sepolia/v0.0.1</code></li>
      </ul>

      <h2>Verification checklist</h2>
      <ol>
        <li>Confirm wallet network is Sepolia.</li>
        <li>Confirm frontend <code>.env</code> addresses match this table.</li>
        <li>Check token decimals in wallet import for BTK.</li>
        <li>Run smoke flow: faucet claim → create idea → vote → read round data.</li>
      </ol>

      <div class="callout danger">
        If you redeploy, update this page immediately and version the change in release notes. <span class="hl-red">Stale addresses will break writes and can route users to wrong contracts.</span>
      </div>
    `,
  },
  {
    slug: "business-flows",
    group: "Protocol",
    title: "Business Flows",
    summary: "Detailed proposal-to-grant flow and important status gates.",
    content: `
      <h1>Business Flows</h1>
      <p class="lead">This section explains the main user and protocol flows with the exact status and policy logic that matters in product behavior.</p>

      <h2>Idea lifecycle</h2>
      <p><code>Pending → Voting → WonVoting/Rejected → Funded → Completed</code></p>

      <h3>1) Create idea</h3>
      <ul>
        <li>Author submits title, description, and link.</li>
        <li>Initial status is <code>Pending</code>.</li>
      </ul>

      <h3>2) Start round</h3>
      <ul>
        <li>Anyone can start a round if pending idea count reaches <code>IDEAS_PER_ROUND</code>.</li>
        <li>Ideas selected for the round switch to <code>Voting</code>.</li>
      </ul>

      <h3>3) Vote with BTK stake</h3>
      <ul>
        <li>Voter stakes BTK through FundingPool path.</li>
        <li>System enforces min stake, one vote per round per address, and round time window.</li>
      </ul>

      <h3>4) End round</h3>
      <ul>
        <li>Anyone can call end when time window is over.</li>
        <li>Highest-vote idea wins.</li>
        <li>Winner gets <code>WonVoting</code>; others move to <code>Rejected</code>.</li>
      </ul>

      <h3>5) Reputation/progression effects</h3>
      <ul>
        <li>Winner author reputation increases.</li>
        <li>Losing authors can decrease by policy.</li>
        <li>Voters on winning idea can increment progression counters.</li>
      </ul>

      <h3>6) Grant execution and completion</h3>
      <ul>
        <li>Grant manager executes distribution from pool under role control.</li>
        <li>Author marks idea completed once in funded state and implementation is done.</li>
      </ul>

      <h2>Review and curation flow</h2>
      <ul>
        <li>Reviewer role can add review text in allowed status windows.</li>
        <li>Curator role can mark low quality in configured status windows.</li>
        <li>Client should block unavailable actions early using status + role checks.</li>
      </ul>
    `,
  },
  {
    slug: "admin-operations",
    group: "Operations",
    title: "Admin Operations",
    summary: "Pause controls, setters, upgrade boundaries, and safe runbook steps.",
    content: `
      <h1>Admin Operations</h1>
      <p class="lead">BERT admin capabilities are powerful and must be treated like governance-level changes with audit trail expectations.</p>

      <h2>Operational priorities</h2>
      <ol>
        <li>Protect admin keys and role authority.</li>
        <li>Keep role wiring verifiable and up-to-date.</li>
        <li>Use pause controls for incident isolation.</li>
        <li>Apply parameter changes with explicit reason and log.</li>
      </ol>

      <h2>Critical setter examples</h2>
      <ul>
        <li><code>VotingSystem.setVotingDuration</code></li>
        <li><code>VotingSystem.setMinStake</code></li>
        <li><code>VotingSystem.setIdeaPerRound</code></li>
        <li><code>GrantManager.setAuthorShare</code></li>
        <li><code>FundingPool.syncBalance</code></li>
        <li><code>BRTFaucet.setClaimAmount</code> and <code>BRTFaucet.setCooldown</code></li>
      </ul>

      <h2>Incident runbook</h2>
      <pre><code>1. Pause affected contracts
2. Identify root cause (role, param, external dependency, or logic)
3. Patch configuration or execute upgrade through ProxyAdmin owner
4. Verify state + role wiring + smoke tests
5. Unpause in controlled order and monitor events</code></pre>

      <h2>Upgrade safety</h2>
      <ul>
        <li>Validate storage layout compatibility before any implementation change.</li>
        <li>Confirm ProxyAdmin owner signer before upgrade call.</li>
        <li>Record tx hash, implementation address, and post-upgrade checks.</li>
      </ul>

      <div class="callout warning">
        Never run high-impact setters and upgrades in one unreviewed batch. Keep operations atomic and traceable.
      </div>
    `,
  },
  {
    slug: "frontend-integration",
    group: "Integration",
    title: "Frontend Integration",
    summary: "How UI should consume contracts and present robust transaction UX.",
    content: `
      <h1>Frontend Integration</h1>
      <p class="lead">This guide is for dApp engineers integrating BERT contracts through wagmi/viem while keeping UX predictable.</p>

      <h2>Environment model</h2>
      <ul>
        <li>Keep one env manifest per network.</li>
        <li>Never mix localhost and Sepolia addresses.</li>
        <li>Align wallet network, frontend transport RPC, and contract addresses.</li>
      </ul>

      <h2>Recommended read/write pattern</h2>
      <ol>
        <li>Read current state via RPC.</li>
        <li>Run preflight checks client-side (status, role, stake, allowance).</li>
        <li>Prompt transaction only if preflight passes.</li>
        <li>Map known errors to friendly UI messages.</li>
      </ol>

      <h2>Example: write with preflight</h2>
      <pre><code>const status = await ideaRegistry.read.getStatus([ideaId])
if (Number(status) !== 1) {
  throw new Error("Review is available only when idea is in Voting status")
}

await walletClient.writeContract({
  address: IDEA_REGISTRY,
  abi: ideaRegistryAbi,
  functionName: "addReview",
  args: [ideaId, comment],
})</code></pre>

      <h2>Hydration and wallet state</h2>
      <ul>
        <li>Avoid rendering wallet-dependent strings on server path when possible.</li>
        <li>Use mounted/client guards for address-dependent labels.</li>
        <li>Keep deterministic initial text to avoid hydration mismatch warnings.</li>
      </ul>
    `,
  },
  {
    slug: "subgraph",
    group: "Integration",
    title: "The Graph Integration",
    summary: "Subgraph deployment, usage, and frontend query model.",
    content: `
      <h1>The Graph Integration</h1>
      <p class="lead">BERT uses The Graph for indexed history while critical live reads remain available via direct RPC.</p>

      <h2>Current studio deployment</h2>
      <ul>
        <li>Studio subgraph: <a href="https://thegraph.com/studio/subgraph/bert-sepolia" target="_blank" rel="noreferrer">bert-sepolia</a></li>
        <li>Queries endpoint: <code>https://api.studio.thegraph.com/query/1742046/bert-sepolia/v0.0.1</code></li>
      </ul>

      <h2>Frontend configuration</h2>
      <pre><code>NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1742046/bert-sepolia/v0.0.1</code></pre>

      <h2>When to use subgraph vs RPC</h2>
      <table>
        <thead><tr><th>Use case</th><th>Preferred source</th></tr></thead>
        <tbody>
          <tr><td>Current balances, statuses, role checks</td><td>Direct RPC reads</td></tr>
          <tr><td>Historical lists, activity timeline, aggregated views</td><td>Subgraph queries</td></tr>
          <tr><td>Write eligibility prechecks</td><td>RPC (authoritative)</td></tr>
          <tr><td>Page-level analytics widgets</td><td>Subgraph</td></tr>
        </tbody>
      </table>

      <h2>Deployment commands</h2>
      <pre><code>npm run codegen:sepolia
npm run build:sepolia
npx graph deploy bert-sepolia subgraph.yaml --deploy-key YOUR_DEPLOY_KEY --version-label vX.Y.Z</code></pre>

      <div class="callout info">
        Keep startBlock values as close as possible to actual contract deployment blocks to reduce indexing lag and noise.
      </div>
    `,
  },
  {
    slug: "sepolia-user-guide",
    group: "User Guides",
    title: "Sepolia User Guide",
    summary: "Gas, faucet, wallet setup, and BTK import for end users.",
    content: `
      <h1>Sepolia User Guide</h1>
      <p class="lead">This guide explains how users start interacting with BERT on Sepolia without confusion around gas and token setup.</p>

      <h2>What pays gas?</h2>
      <p><span class="hl-yellow">Sepolia ETH</span> pays all transaction fees. <span class="hl-red">BTK is not a gas token.</span></p>

      <h2>How to get Sepolia ETH</h2>
      <ol>
        <li>Open a Sepolia faucet.</li>
        <li>Request funds to your wallet address.</li>
        <li>Wait for confirmation in wallet/explorer.</li>
        <li>Keep a reserve to avoid interrupted write flows.</li>
      </ol>

      <h2>How to add BTK in MetaMask</h2>
      <ol>
        <li>Switch MetaMask to Sepolia.</li>
        <li>Import custom token.</li>
        <li>Paste BTK contract address: <code>0x89F0645551D669aa8813b245266E8c09Bbe0F9c2</code>.</li>
        <li>Confirm symbol/decimals and save.</li>
      </ol>

      <h2>Common failures</h2>
      <ul>
        <li><strong>NetworkError when attempting to fetch resource:</strong> RPC mismatch, blocked CORS path, or wrong active network.</li>
        <li><strong>No wallet prompt:</strong> preflight check failed before sending transaction.</li>
        <li><strong>Wrong token amount display:</strong> decimals import mismatch in wallet.</li>
      </ul>
    `,
  },
  {
    slug: "code-examples",
    group: "Integration",
    title: "Code Examples",
    summary: "Practical snippets for reads, writes, role checks, and ops.",
    content: `
      <h1>Code Examples</h1>
      <p class="lead">Use these snippets as templates. Validate ABIs and addresses in your repo before copy-pasting into production paths.</p>

      <h2>Read round info (viem)</h2>
      <pre><code>const round = await publicClient.readContract({
  address: VOTING_SYSTEM,
  abi: votingAbi,
  functionName: "getRoundInfo",
  args: [1n],
})

const [id, ideaIds, start, end, active, ended, totalVotes] = round</code></pre>

      <h2>Approve and vote sequence</h2>
      <pre><code>// 1) approve token spend
await walletClient.writeContract({
  address: GOV_TOKEN,
  abi: erc20Abi,
  functionName: "approve",
  args: [FUNDING_POOL, amount],
})

// 2) cast vote
await walletClient.writeContract({
  address: VOTING_SYSTEM,
  abi: votingAbi,
  functionName: "vote",
  args: [roundId, ideaId, amount],
})</code></pre>

      <h2>Hardhat console role check</h2>
      <pre><code>const roles = await ethers.getContractAt("RolesRegistryUpgradeable", ROLES)
const CURATOR_ROLE = await roles.CURATOR_ROLE()
console.log(await roles.hasRole(CURATOR_ROLE, user))</code></pre>

      <h2>Deployment verification snippet</h2>
      <pre><code>const code = await ethers.provider.getCode(PROXY_ADDRESS)
if (code === "0x") throw new Error("Proxy address has no code")

const ok = await roles.hasRole(await roles.VOTING_ROLE(), VOTING_SYSTEM)
console.log("voting role wired", ok)</code></pre>
    `,
  },
  {
    slug: "security-ops",
    group: "Operations",
    title: "Security & Operations",
    summary: "Controls, monitoring, incident response, and release hygiene.",
    content: `
      <h1>Security & Operations</h1>
      <p class="lead">Operational security is a process. This section defines what to monitor and what to execute when incidents occur.</p>

      <h2>Minimum controls</h2>
      <ul>
        <li>Hardware-backed admin keys or multisig for privileged actions.</li>
        <li>Explicit role matrix with owners and emergency contacts.</li>
        <li>Event monitoring for upgrades, role changes, pause toggles, and payout actions.</li>
      </ul>

      <h2>Pre-release gate</h2>
      <ol>
        <li>Contract test suite green.</li>
        <li>Role wiring verified on target network.</li>
        <li>Pause states match expected launch config.</li>
        <li>Smoke flow from non-admin wallet is successful.</li>
      </ol>

      <h2>Post-release monitoring</h2>
      <ul>
        <li>Unexpected admin writes</li>
        <li>Transaction revert spike by endpoint</li>
        <li>Subgraph indexing lag and query failures</li>
        <li>Drift between subgraph projections and RPC reads</li>
      </ul>

      <h2>Known current roadmap constraints</h2>
      <ul>
        <li>External audit planned but not yet complete.</li>
        <li>Public bug bounty program planned, currently not active.</li>
      </ul>
    `,
  },
  {
    slug: "faq",
    group: "Reference",
    title: "FAQ",
    summary: "Short answers to recurring implementation and user questions.",
    content: `
      <h1>FAQ</h1>

      <h2>Why does a write call show "NetworkError when attempting to fetch resource"?</h2>
      <p>Usually RPC endpoint mismatch, blocked CORS path, or wallet connected to different chain than frontend transport.</p>

      <h2>Why can claim work but page data still shows dots or empty values?</h2>
      <p>One endpoint path may be reachable while another fetch path or indexing source is not. Check both RPC and subgraph configuration.</p>

      <h2>Why does MetaMask show warning about security provider?</h2>
      <p>Security simulation providers may not classify custom testnet contracts immediately. Confirm contract addresses manually and proceed only on trusted deployments.</p>

      <h2>Can we run multiple rounds simultaneously?</h2>
      <p>Yes, if contract logic allows and operational policy accepts overlap. Ensure round lifecycle and idea allocation logic remain deterministic.</p>

      <h2>Do users need BTK to pay for gas?</h2>
      <p>No. Gas is always paid in the native network coin (Sepolia ETH on Sepolia).</p>

      <h2>Where should detailed product docs live?</h2>
      <p>Preferred path is a dedicated docs deployment (e.g. <code>docs.yourdomain.xyz</code>) with versioned release notes and searchable content.</p>
    `,
  },
  {
    slug: "release-notes",
    group: "Reference",
    title: "Release Notes Template",
    summary: "Template for documenting protocol and frontend releases.",
    content: `
      <h1>Release Notes Template</h1>
      <p class="lead">Use this template for every release touching contracts, ABI, addresses, or frontend write paths.</p>

      <h2>Template</h2>
      <pre><code># Release X.Y.Z - YYYY-MM-DD

## Scope
- Contracts:
- Frontend pages/components:
- Subgraph:

## Contract changes
- Changed modules:
- New implementation addresses:
- Storage layout impact:

## Config changes
- Updated env vars:
- Updated network manifests:

## Migration steps
1.
2.
3.

## Verification
- Role wiring checks:
- Pause state checks:
- Smoke flows:

## Rollback plan
- Trigger conditions:
- Rollback steps:
- Owner:
</code></pre>

      <h2>Why this matters</h2>
      <p>Without structured notes, incident root-cause analysis gets slower and riskier. Keep release notes immutable once published.</p>
    `,
  },
];
