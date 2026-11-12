const chapters = {
  foundations: [
    'Start with the memory model. A multiprocessor gives CPUs a shared address space. Bus-based designs use caches to reduce bus traffic, a crossbar offers multiple simultaneous connections, and an Omega network trades full connectivity under simultaneous demand for fewer switches. A multicomputer has a private memory per node and communicates by explicit messages.',
    'A perfect shuffle rotates an address’s binary digits left by one position. An N×N Omega network for N=2ᵏ has k stages and N/2 switches per stage. Route using destination bits from most to least significant. A route is unique, so two connections can contend for the same internal output even if their final destinations differ.',
    'Design concerns include transparency, flexibility, reliability, performance and scalability. Access hides remote mechanics, location hides the host name, migration hides moves, replication hides copy count and concurrency hides user interference. Geographic distance, centralized metadata and growing coordination overhead can each limit scaling.',
    'ATM uses 53-byte cells, including a 5-byte header. The physical layer transmits bits, delineates cells, handles header error control, and adapts the cell rate. Virtual path and channel identifiers are used by the ATM layer.'
  ],
  communication: [
    'In client–server messaging, a client addresses a request to a server and waits or continues depending on the primitive. A blocking receive waits for data, while a nonblocking receive returns promptly. A buffered mailbox decouples sender and receiver in time. A rendezvous requires both sides to participate before the handoff completes.',
    'RPC hides messages behind a procedure interface. The client stub marshals arguments, the server stub unmarshals them and calls the implementation, and the result returns along the reverse path. Use a defined byte order and data representation. An address valid in one process cannot be sent as a usable pointer in another process.',
    'For sequential calls, T = kF + cD, where k counts calls and D is total data. Grouping work saves fixed cost. Stop-and-wait serializes data and acknowledgments, while a sliding window allows several packets in flight. Batching can increase latency for the first item if it has to wait for a batch.',
    'Timeouts cannot distinguish a lost request from a lost reply. Retries provide at-least-once attempts. Use request IDs and deduplication to avoid duplicate effects within the chosen failure model. Durable state or idempotency matters when the server can crash after doing work.'
  ],
  coordination: [
    'Physical clocks drift, so readings can diverge after synchronization. Cristian estimates server time plus half the RTT. Berkeley estimates a common internal target, typically averaging readings aligned to the same instant and sending signed offsets. An externally accurate clock is optional for Berkeley.',
    'Lamport clocks start at a counter value, increment on local and send events, and set the receiver to max(local, received)+1. If a happened before b, L(a)<L(b). The converse need not hold. A vector clock increments a local component and merges the received vector component-wise, so incomparable vectors identify concurrent events.',
    'Centralized mutual exclusion uses a coordinator to grant access. Ricart–Agrawala sends a timestamped request to every peer, delays replies when a local request for that region has priority, and enters after all peers reply. This costs 2(N−1) messages per entry. Token-ring mutual exclusion allows only the token holder to enter.',
    'Bully asks higher IDs to respond and elects the highest live ID. A ring election circulates a candidate or ID list and then circulates the coordinator announcement. Timeouts are failure suspicions and both algorithms rely on their respective membership and communication assumptions.'
  ],
  transactions: [
    'Atomicity means all-or-nothing, consistency preserves application invariants, isolation controls concurrent visibility and durability preserves committed effects. In two-phase commit, participants log a prepared vote before replying yes. The coordinator logs and announces commit only if all voted yes. A prepared participant can block if it cannot learn the decision.',
    'Concurrency control can use strict two-phase locking or timestamp ordering. In two-phase locking, a growing phase obtains locks and a shrinking phase releases them. Strict 2PL holds write locks until commit or abort, avoiding dirty reads and cascading aborts.',
    'Deadlock prevention rules eliminate cycles by imposing a fixed direction on waits. In wait–die the older requester waits and the younger requester aborts. In wound–wait the older requester aborts the younger holder and the younger requester waits. Preserve the original timestamp after a retry.',
    'Detection examines wait-for edges. A central detector can combine stale edges into a false cycle. In the AND-model Chandy–Misra–Haas scheme, a probe travels along blocked dependencies. If it returns to its initiator under the algorithm’s rules, the initiator detects a deadlock.'
  ],
  scheduling: [
    'Threads share their process’s code, heap and resources while keeping their own stack and execution state. User-level threads can be cheap to switch, but a blocking system call can block all of them in a many-to-one implementation. Kernel-supported threads can run in parallel and be scheduled independently.',
    'A dispatcher–worker pool assigns requests centrally. A team has peers pulling requests from a queue. A pipeline passes jobs between specialized stages and improves throughput when work overlaps, though its slowest stage sets the steady-state rate. A durable queue can reassign work after a host failure.',
    'Graph-theoretic allocation models tasks as vertices and communication as weighted edges. Respect each machine’s capacity and minimize the sum of cross-machine edge weights. Dynamic alternatives include sender-initiated and receiver-initiated load sharing.',
    'Co-scheduling aligns scheduling slots across processors so interacting tasks run concurrently. In a scheduling matrix, columns represent processors and rows represent aligned slots. This lowers communication waits at the cost of synchronization and possible idle capacity.'
  ],
  replication: [
    'Replication spreads reads, reduces geographic access latency and can improve availability. Choose replica placement, ownership, write ordering, and the point at which a write is acknowledged. A strict model uses real-time write order. Sequential consistency preserves each process’s program order in a single global order.',
    'Causal consistency orders writes linked by causality. FIFO consistency preserves each writer’s order. Eventual consistency says replicas converge if updates stop and replication continues. Client-centric models include monotonic reads, monotonic writes, read-your-writes, and writes-follow-reads.',
    'A fail-silent replica produces no output after failing. A Byzantine replica can produce arbitrary and conflicting output. Intermittent faults recur, whereas permanent faults persist until repaired. Replication assumptions must match the fault model.',
    'Active replication executes the same ordered operations at each replica. Primary–backup replicates state or a log from one primary and switches roles after failure. Triple modular redundancy votes on three outputs and tolerates one wrong module when the others agree and the voter works. Common-mode failures defeat the independence assumption.'
  ],
  memory: [
    'Distributed shared memory exposes a common address space over nodes with private memory. It may transfer blocks, pages or objects. Choose a coherence protocol, transfer granularity and ownership scheme. A shared address space does not by itself guarantee a particular consistency model.',
    'Memnet uses a ring for cache-coherent distributed memory. DASH groups CPUs into clusters, uses a switched interconnect and keeps a per-block directory at the home cluster. The directory can contact current sharers or the owner without broadcasting to every cluster.',
    'Write-once performs a write-through on the first shared write while invalidating other copies. The exclusive cache can use write-back on subsequent writes. A conflicting reader must get the latest value, which may reside in the dirty owner.',
    'Page-based DSM handles remote shared pages through page faults and permissions. Read sharing is inexpensive until a write requires new ownership. False sharing happens when separate variables on the same page cause repeated ownership transfers.'
  ]
};
export const NOTES = Object.entries(chapters).map(([topic,paragraphs])=>({
  topic,text:paragraphs.join(' '),html:paragraphs.map(text=>'<p>'+text+'</p>').join('')
}));
