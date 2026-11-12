import {answers,p,list,table} from './answers.mjs';
import {berkeleyDiagram,electionDiagram,omegaDiagram,probeDiagram,ringDiagram,rpcDiagram} from './diagrams.mjs';
import {NOTES} from './notes.mjs';

export {NOTES};
export const TOPICS={
  foundations:['Architecture and transparency','Multiprocessors, multicomputers, ATM and the Omega network'],
  communication:['Message passing and RPC','Mailboxes, stubs, performance and failure semantics'],
  coordination:['Clocks and coordination','Logical clocks, synchronization, mutual exclusion and elections'],
  transactions:['Transactions and deadlocks','Atomic commit, wait-for graphs and timestamp prevention'],
  scheduling:['Threads and scheduling','Thread models, processor allocation and co-scheduling'],
  replication:['Replication and fault tolerance','Consistency, fault models and replica management'],
  memory:['Distributed shared memory','Ring, directory and page-based coherence']
};
export const ORDER=Object.keys(TOPICS);
export const PAPERS={
  D25:{label:'2025 Autumn'},
  D24:{label:'2024 Autumn'}
};
export const SCANS=Object.fromEntries(Object.keys(PAPERS).map(id=>[id,
  [1,2,3,4].map(page=>'assets/dos-20'+id.slice(1)+'-'+page+'.jpg')
]));

function paper(id, rows) {
  return rows.map(([ref,page,topic,question,ahtml])=>({
    id:id+'-'+ref,ref,paper:id,page,topic,marks:ref.startsWith('1(')?1:5,
    question,qhtml:p(question),solution:ahtml,ahtml
  }));
}

export const QS=[
  ...paper('D25',[
    ['1(a)',1,'foundations','Differentiate multiprocessor and multicomputer systems in a distributed environment.',p('A multiprocessor has processors sharing an address space and accessing shared memory through loads and stores. A multicomputer consists of computers with private memories that exchange messages over a network.')],
    ['1(b)',1,'foundations','Do centralized systems automatically provide concurrency transparency? Justify your answer.',answers.concurrency],
    ['1(c)',1,'foundations','What are the functions of the ATM physical layer?',p('The physical medium sublayer handles transmission, line coding, and bit timing. Transmission convergence provides cell delineation, HEC generation/checking for the cell header, and cell-rate adaptation using idle cells.')],
    ['1(d)',1,'communication','What is marshaling in RPC?',p('Marshaling encodes the operation identifier and arguments into an agreed wire format. The receiving stub unmarshals the bytes into values the callee can use.')],
    ['1(e)',1,'transactions','What is atomic transaction implementation in a distributed environment?',p('The transaction either commits at every participant or aborts everywhere. In two-phase commit, a coordinator collects durable prepare votes and commits only if every participant votes yes. Otherwise it decides abort.')],
    ['1(f)',1,'coordination','How does Cristian’s algorithm synchronize clocks?',p('A client requests time from a server synchronized to a reference clock, measures round-trip time, and estimates the time at reply arrival as the server’s timestamp plus half the RTT under approximately symmetric delay.')],
    ['1(g)',2,'replication','Explain strict consistency with an example.',p('Each read returns the value of the most recent write in absolute real time. If a write sets x = 4 and no intervening write occurs before a later read starts, that read must return 4 at every replica.')],
    ['1(h)',2,'replication','State the objectives of replica management.',p('Choose replica placement and coordinate updates to improve availability, read locality and throughput, while meeting the required consistency and durability guarantees.')],
    ['1(i)',2,'memory','Explain Memnet in a ring-based multiprocessor system.',answers.memnet],
    ['1(j)',2,'replication','Differentiate fail-silent faults from Byzantine faults.',p('A fail-silent component stops responding rather than producing incorrect outputs. A Byzantine component can behave arbitrarily, including returning conflicting results to different receivers.')],
    ['2(a)',2,'foundations','Construct an 8 × 8 Omega network. Find the number of stages, total switches, and switches per stage.',answers.omega],
    ['2(b)',2,'replication','Explain triple modular redundancy and how it improves fault tolerance.',p('Run the same operation on three independent modules and feed their outputs to a majority voter. If one module fails arbitrarily while the other two return the same correct result, the voter outputs that result.')+
      table(['Module A','Module B','Module C','Voted result'],[['7','7','12','<strong>7</strong>']])+p('If module reliability is R and failures are independent, an ideal voter yields reliability 3R²(1−R)+R³ = 3R²−2R³. Shared software defects, common infrastructure failures and a faulty voter can defeat this protection.')],
    ['3(a)',2,'foundations','Explain design issues in distributed operating systems. Compare location and migration transparency.',answers.transparency],
    ['3(b)',2,'communication','A null RPC takes 1.0 ms plus 1.5 ms per KB. Compare a single 32 KB RPC with 32 separate 1 KB RPCs.',answers.rpcCost],
    ['4(a)',3,'coordination','Explain Berkeley synchronization. Find the target and offsets for clocks reading 300, 270, 290 and 310 ms at the same instant.',answers.berkeley],
    ['4(b)',3,'scheduling','Describe thread usage models for parallelism, load balancing, and fault tolerance.',answers.threading],
    ['5(a)',3,'scheduling','Explain graph-theoretic deterministic processor allocation with an example.',answers.allocation],
    ['5(b)',3,'transactions','P1 at timestamp 50 requests a resource held by P2 at 100. Apply wait–die and wound–wait.',answers.prevention],
    ['6(a)',3,'replication','Design a protocol that eventually updates every workstation’s local binary, even when some miss the initial release.',answers.versioning],
    ['6(b)',4,'transactions','Explain false deadlock in centralized detection and how Chandy–Misra–Haas addresses it.',answers.falseDeadlock],
    ['7(i)',4,'scheduling','Write a short note on co-scheduling.',p('Co-scheduling places communicating tasks in the same scheduling slot on different processors, reducing the time a runnable task waits for a partner that is currently off-CPU.')+
      table(['Time slot','CPU 0','CPU 1','CPU 2'],[['0','Job A / thread 1','Job A / thread 2','Job A / thread 3'],['1','Job B / thread 1','Job B / thread 2','—']])+p('Each processor cycles through the same row at a synchronized boundary. This helps tightly coupled workloads, though reserving whole slots can leave cores idle and coordinating slices introduces overhead.')],
    ['7(ii)',4,'memory','Write a short note on the write-once cache coherence protocol.',p('Write-once combines a write-through first write with write-back on later writes. Cache blocks can be invalid, valid (clean), reserved, or dirty.')+
      list('A read may obtain a clean shared copy.','The first write to a shared valid line writes through to memory and invalidates other copies. The writing cache becomes the exclusive owner (reserved).','Later writes by that owner can proceed locally, marking the line dirty.','On a later conflicting read or eviction, the dirty owner supplies or writes back the newest data so another processor does not read stale memory.')+
      p('“Once” refers to the initial write-through while obtaining exclusive ownership.')],
    ['7(iii)',4,'memory','Write a short note on DASH as a switched multiprocessor.',p('DASH is a directory-based cache-coherent shared-memory multiprocessor. It groups processors into bus-connected clusters and connects clusters through a switched network. Memory is physically distributed while presenting a shared address space.')+
      list('A request for a block is sent to its home cluster, which maintains directory state.','The directory identifies sharers or an exclusive owner and routes the data request appropriately.','A write request causes targeted invalidations. After the required acknowledgments, the writer holds exclusive permission.')+
      p('This avoids global broadcast across all clusters, at the cost of directory storage and more complex coherence messages.')],
    ['7(iv)',4,'memory','Write a short note on page-based distributed shared memory.',p('Page-based DSM uses the virtual memory system to present a shared address space across private memories. When a process accesses a missing or protected shared page, the page fault handler obtains the page and the required permissions over the network.')+
      list('Multiple read-only copies may coexist.','On a write fault, the coherence protocol grants write ownership and invalidates other copies or propagates the update.','A later fault on another node fetches the latest page from its current owner or a manager.')+
      p('Page granularity simplifies OS integration but can cause false sharing when unrelated variables on the same page are modified by different machines.')],
    ['7(v)',4,'communication','Explain RPC semantics in the presence of failure.',table(['Failure','Effect and mitigation'],[
      ['Client cannot locate server','Binding fails. Return an error or rediscover the service.'],
      ['Request lost','Timeout and resend using the same request ID.'],
      ['Reply lost','The call may already have executed. A server can return a cached result for a duplicate ID.'],
      ['Server crashes','The client cannot infer whether the operation ran. Durable deduplication and recovery help preserve at-most-once effects.'],
      ['Client crashes','Outstanding work can become orphaned. Use cancellation, deadlines, or leases where appropriate.']
    ])+p('At-least-once retries can repeat an operation. At-most-once suppresses duplicates within its fault assumptions. A timeout alone cannot establish exactly-once effects.')]
  ]),
  ...paper('D24',[
    ['1(a)',1,'foundations','Give two advantages of distributed systems over centralized ones.',p('Horizontal scaling adds processing capacity by adding nodes. Replication across independent nodes can let the service remain available after one node fails.')],
    ['1(b)',1,'foundations','Do centralized systems automatically have concurrency transparency?',answers.concurrency],
    ['1(c)',1,'foundations','Why is ATM called a cell-based architecture?',p('ATM segments traffic into fixed 53-byte cells. Each has a 5-byte header and a 48-byte payload. Switches forward these fixed-size units on virtual connections.')],
    ['1(d)',1,'communication','Explain a mailbox in buffered communication primitives.',p('A mailbox is an OS-managed message queue. A sender deposits a message for later retrieval, so a receiver need not already be waiting. A bounded mailbox may block a sender or return an error when full.')],
    ['1(e)',1,'coordination','Explain clock tick and clock skew.',p('A tick is one increment of a clock or counter. Skew is the difference between the readings of two clocks at the same real instant. For logical clocks the counters represent event order, while numerical time skew usually refers to physical clocks.')],
    ['1(f)',1,'transactions','Why is deadlock avoidance rarely used in distributed systems?',p('Avoidance needs timely knowledge of global allocation and future resource demands to test whether a grant leaves the system safe. Gathering that information across nodes is expensive and can yield stale views.')],
    ['1(g)',2,'replication','Differentiate intermittent and permanent faults.',p('An intermittent fault appears, disappears, and can recur, often under particular conditions. A permanent fault persists until repair or replacement.')],
    ['1(h)',2,'replication','What is active replication?',p('Each replica processes the same ordered requests, starting from equivalent state. Deterministic replicas produce matching state and results, so surviving copies can keep serving after a fault.')],
    ['1(i)',2,'memory','Explain Memnet in a ring-based multiprocessor system.',answers.memnet],
    ['1(j)',2,'coordination','What is the worst-case message complexity of the Bully election algorithm?',p('<strong>Θ(n²).</strong> A low-ID initiator contacts all higher IDs, and many of those processes in turn contact all higher IDs. With n live processes and every higher-ID pair exchanging ELECTION and OK, that is n(n−1) messages plus n−1 coordinator notices, or n²−1. Attempts to contact a failed process can change that exact count.')],
    ['2(a)',2,'foundations','Construct an 8 × 8 Omega network and calculate stages, switches per stage, and total switches.',answers.omega],
    ['2(b)',2,'communication','Explain the 14 steps of a client-to-server Remote Procedure Call.',answers.rpcSteps],
    ['3(a)',2,'foundations','Explain transparency and distinguish location transparency from migration transparency.',answers.transparency],
    ['3(b)',2,'communication','A null RPC costs 1.0 ms and each KB adds 1.5 ms. Compare reading 32 KB in one call and in 32 calls.',answers.rpcCost],
    ['4(a)',2,'coordination','Two clocks tick at 1,000 and 990 ticks/ms. They synchronize once a minute. Find the maximum skew.',p('The clocks are aligned immediately after an update. The slower one loses 10 ticks per millisecond relative to the faster one.')+
      list('One minute is 60,000 ms.','Accumulated difference is 10 × 60,000 = 600,000 ticks.','At 1,000 nominal ticks/ms, skew is 600,000 ÷ 1,000 = <strong>600 ms (0.6 s)</strong>.')+
      p('This is the largest difference just before the next update, assuming perfect synchronization at the start and constant rates.')],
    ['4(b)',3,'coordination','P0 requests critical region A and P1 requests independent region B. Can Ricart–Agrawala lead to deadlock?',p('<strong>No, for independent requests with no nested acquisition.</strong> Tag requests with the region ID. Each process decides to defer replies only for requests for the same region. A request for A does not conflict with a request for B, so both can receive permission.')+
      p('Within one region, requests are totally ordered by (Lamport timestamp, process ID). The earliest competing request cannot wait on a later one, preventing circular wait. If an application holds A while requesting B and another holds B while requesting A, that is a separate lock-ordering problem. Process failures can also stall the unmodified protocol.')],
    ['5(a)',3,'transactions','Explain false deadlock and distributed detection with Chandy–Misra–Haas.',answers.falseDeadlock],
    ['5(b)',3,'transactions','Compare detection and prevention. Apply wait–die and wound–wait to timestamps 50 and 100.',answers.prevention],
    ['6(a)',3,'replication','Design an automatic binary update algorithm for workstations that may be down when a release is sent.',answers.versioning],
    ['6(b)',3,'replication','Explain fault tolerance with active replication and primary–backup.',answers.replication],
    ['7(a)',4,'coordination','Explain the Bully and Ring election algorithms with diagrams.',answers.elections],
    ['7(b)',4,'replication','Explain two strong and two weaker data-centric consistency models, each with an example.',table(['Model','Guarantee','Example'],[
      ['Strict','Reads return the most recent write in absolute real time.','After W(x=1) completes, a later read returns 1 in the absence of another write.'],
      ['Sequential','All operations appear in one global order that preserves each process’s program order.','Everyone can agree that a concurrent W(x=1) preceded W(x=2), regardless of real-time completion order.'],
      ['Causal','All observers preserve the order of causally related writes. Concurrent writes may be observed in different orders.','A reply cannot be observed ahead of the message that caused it.'],
      ['FIFO (PRAM)','Writes by one process are observed in that process’s issue order. Writes by different processes may be interleaved differently.','All readers observe A’s x=1 before A’s x=2, but may disagree about where B’s write appears.']
    ])+p('If the syllabus uses “weak consistency” as a named model, explain that synchronization operations make prior writes visible and ordinary reads between synchronization points may see stale data.')]
  ])
];

export const REPEATS=[
  {title:'Omega network construction',why:'Draw the perfect shuffle, then count stages and 2×2 switches.',refs:['D25-2(a)','D24-2(a)']},
  {title:'RPC batching',why:'Separate fixed cost per request from cost per KB.',refs:['D25-3(b)','D24-3(b)']},
  {title:'Distributed deadlocks',why:'Distinguish a stale wait-for cycle from a valid probe and compare timestamp rules.',refs:['D25-5(b)','D25-6(b)','D24-5(a)','D24-5(b)']},
  {title:'Versioned workstation rollout',why:'Cover boot-time catch-up, monotonic versioning and eventual convergence.',refs:['D25-6(a)','D24-6(a)']},
  {title:'Transparency and Memnet',why:'Location versus migration and ring-based shared memory appear in both papers.',refs:['D25-3(a)','D24-3(a)','D25-1(i)','D24-1(i)']},
  {title:'Physical clock calculations',why:'Work both a coordinated offset and the drift accumulated between updates.',refs:['D25-4(a)','D24-4(a)']}
];
export const FORMULA_ENTRIES=[
  {topic:'foundations',title:'Omega switches',equation:'Stages = log₂ N · Switches per stage = N/2 · Total = (N/2) log₂ N',description:'For N inputs and N outputs, with N a power of two.',refs:['D25-2(a)','D24-2(a)']},
  {topic:'communication',title:'RPC fixed and transfer cost',equation:'T = kF + cD',description:'k sequential calls, fixed cost F per call, total data D and cost c per unit of data.',refs:['D25-3(b)','D24-3(b)']},
  {topic:'coordination',title:'Berkeley correction',equation:'Target = Σ tᵢ / n · Adjustmentᵢ = Target − tᵢ',description:'Use retained clock readings aligned to the same real instant.',refs:['D25-4(a)']},
  {topic:'coordination',title:'Clock skew from tick rates',equation:'Skew = |r₁ − r₂| × Δt / r₀',description:'Divide the accumulated tick difference by the nominal tick rate r₀.',refs:['D24-4(a)']},
  {topic:'replication',title:'Triple modular redundancy',equation:'R(TMR) = 3R² − 2R³',description:'Independent, equally reliable modules and a perfect majority voter.',refs:['D25-2(b)']}
];
export const DIAGRAMS=[
  {id:'omega',topic:'foundations',title:'8 × 8 Omega network',ref:'D25-2(a)',html:omegaDiagram()},
  {id:'rpc',topic:'communication',title:'RPC request and reply',ref:'D24-2(b)',html:rpcDiagram},
  {id:'berkeley',topic:'coordination',title:'Berkeley clock polling',ref:'D25-4(a)',html:berkeleyDiagram},
  {id:'bully',topic:'coordination',title:'Bully election',ref:'D24-7(a)',html:electionDiagram},
  {id:'ring',topic:'coordination',title:'Ring election',ref:'D24-7(a)',html:ringDiagram},
  {id:'probes',topic:'transactions',title:'Chandy–Misra–Haas probes',ref:'D25-6(b)',html:probeDiagram}
];
