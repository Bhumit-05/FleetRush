# FleetRush Link | Real-Time Distributed Multiplayer Engine

FleetRush Link is a secure, event-driven full-stack multiplayer gaming platform built to handle high-frequency, bi-directional state synchronization. By decoupling temporary match states from permanent analytical data, the system achieves sub-100ms processing cycles while preserving data integrity.

---

## 🛠️ Tech Stack & Architecture Matrix

| Layer | Technology | Operational Purpose |
| :--- | :--- | :--- |
| **Frontend UI Hub** | Next.js 14 / React.js | State-driven view router, custom hooks, Tailwind CSS layout frames |
| **Application Server** | Node.js / Express.js | Stateless REST API delivery, decoupled custom verification routing |
| **Real-Time Network** | WebSockets (`ws`) | Persistent full-duplex TCP pipelines for streaming low-latency event packets |
| **Volatile State Cache**| Upstash Redis | Atomic in-memory data arrays to eliminate concurrent matchmaking race conditions |
| **Persistent Ledger** | PostgreSQL (NeonDB) | ACID-compliant historical user performance indices and transaction processing |
| **Security Layer** | JWT & Bcryptjs | Cryptographic identity signatures and cryptographic password hashing |

---

## 🚀 Architectural Deep-Dive & System Flow

### 1. Zero-Trust Authentication & Session Persistence
* Custom decoupled **Authentication Middleware** guards all profile-sensitive endpoints on the server.
* On successful login, the server issues an encrypted **JSON Web Token (JWT)**.
* The frontend stores this token inside browser **LocalStorage**, executing automatic header authorization injections (`Authorization: Bearer <token>`) during data sync phases to prevent client-side data tampering.

### 2. Atomic Matchmaking Queue
* Multi-user concurrency is managed cleanly by isolating the volatile matchmaking pool inside **Redis**.
* Because Redis operates sequentially on a single-threaded event loop, matching pool pushes are fully atomic. This removes the risk of multi-user collision race conditions when pairing identical socket registrations.

### 3. Bidirectional Low-Latency Event Loop
* Standard HTTP polling overhead is eliminated by executing active match sessions over a continuous **WebSocket TCP connection**.
* Board inputs, hits, misses, and structural outcomes are computed instantly inside Redis memory slots and broadcasted simultaneously down to both remote client sessions.
* Raw matrix coordinates are intercepted by an optimization script on the client and mapped cleanly into a real-time monospace terminal combat stream layout.

### 4. Connection Lifecycle & Memory Management
* The platform dynamically hooks into the WebSocket `ws.on('close')` connection pipeline.
* If a tab reloads or a user loses internet connectivity, the backend executes self-cleaning garbage collection routines: stripping the abandoned socket registration from pairing pools and evicting stale game cache states out of Redis memory to prevent memory leaks.

---