# HydroChain Demo Script (about 7 minutes)

## Do I need MetaMask?
**No.** Nothing in the running app talks to MetaMask or Sepolia. Credits are recorded in a local **SHA-256 hash-chained ledger** that follows the same issue → transfer → retire lifecycle as the `HydrogenCredit` Solidity contract in the README. Don't open MetaMask during the demo. If someone asks, see Q&A below.

## Before you present (5 minutes)
1. Stop any running server (Ctrl-C), then run:
   ```bash
   npm run seed
   npm run dev
   ```
2. In Chrome, open **three tabs** at http://localhost:5173/login and log in once per tab. Each tab keeps its own login:

   | Tab | Role tab | Username | Password | DID |
   |---|---|---|---|---|
   | 1 | Plant | `greenplant` | `plant123` | `did:hydro:plant1` |
   | 2 | Industry | `steelco` | `industry123` | `did:hydro:industry1` |
   | 3 | Auditor | `auditor` | `auditor123` | (blank) |

3. Open a 4th tab on the landing page http://localhost:5173 and start there.
4. Keep a terminal open in the project folder (for the tamper moment).
5. Optional: have VS Code open on `backend/src/ledger.js` and `backend/src/anomaly.js`.

---

## 1. The problem (landing page, ~45s)
> "Green hydrogen credits only mean something if people trust them. Today the risks are **greenwashing** (claiming hydrogen that was never produced cleanly), **double selling** (the same credit sold twice) and **double counting** (a credit claimed after it was already used). HydroChain makes every credit traceable from production to retirement."

Scroll briefly through *How it works*, then click **Login** (or switch tabs).

## 2. Plant produces hydrogen (Plant tab, ~1 min)
> "This is GreenPlant, a hydrogen producer. Their electrolyzer sends IoT readings: hydrogen produced, purity, electricity used, efficiency and device ID. The plant can't type these numbers in. They come from the sensor."

- Point at **Total Credit Generated: 555** and the credit balance card.
- Click **Generate Credits**.
> "That's 100 kg of hydrogen, which becomes a request for 100 credits. Nothing is minted yet. An independent auditor has to verify it first."

- Pending Approval Credits goes up by 100.

## 3. Auditor verifies (Auditor tab, ~1.5 min)
> "This is the auditor's queue. Every issue, transfer and retirement needs their sign-off."

- Point at the **anomaly column**: green dots are normal readings, red dots are flagged.
- **Hover a red dot** (the 500-credit SolarH2 request):
> "The system has already flagged this one: purity 68% and electrolyzer efficiency 12%. That's physically implausible for green hydrogen, which is exactly what greenwashing looks like."
- Click **View** on it to show the raw IoT data, then click **Reject**.
- Find GreenPlant's new **100** request (green dot), then click **Accept**.
> "Accepting mints a credit with a unique ID and writes it to the ledger."

- Scroll to **Credit Ledger** and point at the newest **ISSUE** block.
> "Each block stores the hash of the block before it. That's what makes the history tamper-evident."

- Back on the **Plant tab** (refreshes within 5 seconds): Total Credit Generated is now **655**.

## 4. Industry buys and retires (Industry tab, ~1.5 min)
> "SteelCo is a steel maker that has to prove it uses green hydrogen."

- Point at **Total Credit Retired 320** and **Total Credit Bought 610**.
- In **Transfer Credits**, type `greenplant` in **Username** and press **Enter**. Pick a credit from **Credit Id**, then click **Transfer Credits**.
> "This is a request to buy that specific credit. A credit has exactly one holder, so it can't be sold twice. If another buyer requests the same credit, they're rejected."
- In the **Auditor tab**, accept the new transfer. The ledger gets a **TRANSFER** block from greenplant to steelco.
- In the **Industry tab**, open the **Credits** dropdown in the retire card, pick a credit, then click **Retire Credits**. Accept it in the Auditor tab.
> "Retiring is the end of the credit's life. Once it's used, it's permanently out of circulation, so nobody can claim it twice."

## 5. Tamper-proof ledger (~1 min). The wow moment
> "What if someone with database access quietly edits a record?"

In the terminal:
```bash
npm run tamper
```
- Within 5 seconds the Auditor tab badge flips from **✓ Chain verified** to **✗ Chain tampered**.
> "We changed one number in one old block. Its hash no longer matches, so the whole chain fails verification. You can't rewrite history without it showing."

```bash
npm run untamper
```
The badge goes back to verified.

## 6. Under the hood (optional, ~1 min)
Show **at most two** snippets:

**a) Hash chain** (`backend/src/ledger.js`):
```js
const payload = [prevHash, type, creditId, fromUser, toUser, amount, createdAt].join("|");
return createHash("sha256").update(payload).digest("hex");
```
> "Every block hashes the previous block's hash, like a blockchain."

**b) Anomaly checks** (`backend/src/anomaly.js`):
```js
if (purity < MIN_PURITY) reasons.push(`purity ${purity}% below ${MIN_PURITY}%`);
if (kg > 0 && kwh / kg < MIN_KWH_PER_KG) reasons.push("electricity use too low for hydrogen produced");
```

**c) Smart contract** (README, `HydrogenCredit.sol`):
```solidity
function transferCredit(string memory creditId, address to) public {
    require(credits[index].holder == msg.sender, 'Not your credit');
    require(!credits[index].retired, 'Credit already retired');
```
> "The same rules are in our Solidity contract for an Ethereum deployment."

## 7. Close (~30s)
> "Verified production with IoT data and an auditor, one owner per credit, permanent retirement, and a ledger you can't quietly rewrite. Next steps: deploy the contract to Sepolia, add decentralized identity verification for each DID, and stream live sensor data instead of samples."

---

## Likely questions
- **"Is this on a real blockchain?"** "The contract is written for Ethereum and Sepolia. For this demo the same lifecycle runs on a local hash-chained ledger, so it's fast and doesn't depend on testnet uptime. Deploying the contract is our next step."
- **"Where does the IoT data come from?"** "Sample sensor readings right now. The backend can switch between normal and faulty readings to show the anomaly checks. In production it would read from the device."
- **"What stops the auditor from cheating?"** "Every decision is recorded with who made it, and the ledger is tamper-evident. Next would be multiple auditors and on-chain signatures."
- **"What's a DID?"** "Decentralized Identifier: a verifiable identity for each plant and buyer. It's checked at login."

## If something breaks
- Blank page or errors: Ctrl-C, run `npm run dev` again, then refresh the tabs.
- A tab shows the wrong user or sends you back to login: log in again in that tab.
- Data got messy from rehearsing: stop the server, run `npm run seed`, start `npm run dev`, and log the 3 tabs in again.
- Show the anomaly on a new request: `curl -X PUT localhost:4000/iot/index -H "Content-Type: application/json" -d '{"scenario":"anomaly"}'` (use `"normal"` to switch back).
