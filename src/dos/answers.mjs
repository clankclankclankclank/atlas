import {berkeleyDiagram,electionDiagram,omegaDiagram,probeDiagram,ringDiagram,rpcDiagram} from './diagrams.mjs';

export const p = text => '<p>'+text+'</p>';
export const list = (...items) => '<ol>'+items.map(text=>'<li>'+text+'</li>').join('')+'</ol>';
export const table = (headers, rows) => '<div class="table-wrap"><table><thead><tr>'+headers.map(value=>'<th scope="col">'+value+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+value+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';

export const answers = {
  concurrency: p('<strong>No.</strong> Centralized processes can still interleave operations on shared data. Two threads incrementing a counter can both read the same value and overwrite each other’s update. Locks or transaction isolation are needed to hide interference.'),
  memnet: p('Memnet presents a shared memory address space over a high-speed ring. Machines retain copies of memory blocks locally and exchange ring messages to locate blocks and enforce coherence, so software can access shared data without explicit message passing.'),
  omega: p('An Omega network uses 2×2 switches and perfect-shuffle wiring. Label each line with three bits and rotate its label left once between each shuffle boundary. In the course diagram this shuffle is also applied before stage 1. Each switch routes to its upper or lower output according to the next destination bit, most significant first.')+
    table(['Quantity','Calculation','Result'],[['Stages','log₂ 8','3'],['Switches per stage','8 ÷ 2','4'],['Total switches','3 × 4','12']])+
    omegaDiagram()+p('For CPU 101 → memory 011, shuffle 101 to 011, then choose output bit 0 to leave on 010. Shuffle to 100, choose 1 to leave on 101, then shuffle to 011 and choose 1. Two routes needing the same switch output at the same time can block each other.'),
  rpcCost: p('For k calls transferring a total of D KB, the given model is <strong>T = k(1.0) + 1.5D ms</strong>. The data cost stays the same in both cases.')+
    table(['Method','Fixed cost','Transfer cost','Total'],[['One 32 KB RPC','1 × 1.0 = 1 ms','32 × 1.5 = 48 ms','<strong>49 ms</strong>'],['32 sequential 1 KB RPCs','32 × 1.0 = 32 ms','32 × 1.5 = 48 ms','<strong>80 ms</strong>']])+p('Batching saves <strong>31 ms</strong> by paying the fixed overhead once.'),
  transparency: p('Transparency hides distribution details behind a stable interface. A resource can be named, reached, and used without exposing the mechanics of remote communication.')+
    table(['Kind','What it hides','Example'],[['Access','Local versus remote access mechanics','The same read operation works on either file'],['Location','Where a named resource currently lives','A pathname does not contain the storage machine’s address'],['Migration','A change in the resource’s location','The same name still works after the service moves to another host'],['Concurrency','Interference between simultaneous users','Transactions isolate conflicting writes'],['Replication','How many physical copies exist','A single logical object has several replicas'],['Failure','Recovery from some faults','A client retries against a healthy replica']])+
    p('Other design concerns include scalability, security, performance, and the guarantees offered during partial failures. A stable name gives location transparency. Preserving that name across a move also requires migration transparency.'),
  rpcSteps: rpcDiagram+list(
    'The client calls the local client stub using the usual procedure interface.',
    'The client stub marshals the operation identifier and arguments into a request.',
    'It invokes the local OS to send the request to the server endpoint.',
    'The client kernel transmits the message across the network.',
    'The server kernel receives the message and identifies the receiving process.',
    'The kernel delivers the request to the waiting server stub.',
    'The server stub unmarshals the arguments into the server’s representation.',
    'The server stub calls the actual server procedure locally.',
    'The procedure executes and returns the result to the server stub.',
    'The server stub marshals the result and request identifier into a reply.',
    'The server kernel sends the reply to the client.',
    'The client kernel receives the reply, delivers it to the waiting stub, and wakes the client.',
    'The client stub unmarshals the result and copies any returned data.',
    'The client stub returns control and the result to the calling procedure.'),
  falseDeadlock: p('A central detector may combine wait-for edges observed at different times. Suppose P1 previously waited for P2, but that edge has been removed. If P2 now waits for P1 and the removal message arrives late, the detector can incorrectly report a cycle.')+
    p('For the AND wait model, Chandy–Misra–Haas uses <strong>probe(i,j,k)</strong>, where i initiated detection and j forwards the probe to k. A blocked initiator sends probes along its current dependencies. A blocked receiver follows its own dependencies and suppresses duplicate work for that initiation. A probe returning to its blocked initiator establishes a cycle under the algorithm’s assumptions.')+
    probeDiagram+p('In the illustrated real cycle, P1 waits for P2, P2 for P3, and P3 for P1. In the stale-edge example an already unblocked process does not extend the probe along its old wait edge.'),
  prevention: p('Detection permits waits and then checks for a cycle. Prevention constrains waits by age so a cycle cannot form. A smaller timestamp means an older transaction.')+
    table(['Rule','Older requests from younger','Younger requests from older','Here: TS(P1)=50, TS(P2)=100'],[['Wait–die','Requester waits','Requester aborts','P1 waits'],['Wound–wait','Holder aborts and releases resource','Requester waits','P1 wounds P2 and can acquire the released resource']])+
    p('Wait edges point in one age direction in each scheme. A restarted transaction should retain its original timestamp so repeated restarts do not keep it permanently young.'),
  versioning: p('Use <strong>eventual consistency</strong> with a single authoritative publisher and monotonically increasing versions. Local copies remain usable while a workstation is offline.')+
    list('Publish an immutable binary and a signed manifest containing its version and hash. Publish the manifest only after the binary is available.',
      'Notify online workstations. Independently, each workstation checks the manifest at startup, reconnect, and on a periodic timer.',
      'If the published version is newer, download to a temporary file, verify the signature and hash, and atomically install the new version.',
      'Record the installed version after installation. Keep the prior binary if verification or installation fails. Retry failed checks with backoff.',
      'A workstation may skip intermediate versions when the latest binary is a complete replacement. Once publishing stops and all machines reconnect long enough, they converge to the latest version.')+
    p('Example: a workstation on v4 misses v5 while offline. It discovers v6 at boot and installs v6 without needing the original push.'),
  replication: p('Fault tolerance keeps the service operating within its stated failure model. Replication maintains enough independent copies to survive the failures it is designed for.')+
    table(['Approach','Normal operation','Failure handling'],[['Active replication','Replicas start from the same state and deterministically execute requests in the same order.','A surviving replica can continue. Use the response-selection rule appropriate for the fault model.'],['Primary–backup','The primary handles requests and propagates state or a log to backups.','After the failure is detected, a suitably up-to-date backup takes over. Election and fencing prevent two primaries from accepting conflicting writes.']])+
    p('For example, three deterministic active replicas tolerate one faulty output when an independent majority voter can compare their replies. A primary–backup system with synchronous replication can retain writes acknowledged by both replicas after one crashes.'),
  elections: p('Both algorithms select a coordinator by priority, usually the greatest live process ID.')+
    list('<strong>Bully.</strong> A process that detects failure sends ELECTION to higher IDs. Any live higher process replies OK and starts or joins its own election. If no higher process replies before timeout, the candidate announces COORDINATOR. For live IDs 1, 2, and 3, a P1-initiated election ends with P3.',
         '<strong>Ring.</strong> In a logical ring, an election message traverses live successors and carries the highest observed ID, or a list of IDs. When it completes a circuit, the highest live ID is announced in a coordinator message. Example: P1 → P2 → P3 → P1, then announce P3 around the ring.')+
    electionDiagram+ringDiagram+p('A single ring election takes two ring traversals in this version. Bully can use Θ(n²) messages when many higher-priority processes respond and run overlapping elections.'),
  berkeley: p('Berkeley provides internal synchronization. The coordinator polls workers, estimates readings at a common instant, rejects outliers if necessary, averages the accepted readings with its own, and sends signed corrections.')+
    p('Average = (300 + 270 + 290 + 310) ÷ 4 = <strong>292.5 ms</strong>. Adjustment = target − current reading.')+
    table(['Machine','Current','Correction'],[['M','300 ms','−7.5 ms'],['S1','270 ms','+22.5 ms'],['S2','290 ms','+2.5 ms'],['S3','310 ms','−17.5 ms']])+
    p('All four readings are already for the same real-time instant, so this calculation needs no network-delay correction. A fast clock can be slowed gradually to avoid making time run backward.')+berkeleyDiagram,
  threading: table(['Model','Implementation','Parallelism and load balancing'],[
    ['Dispatcher–worker','A dispatcher reads the system mailbox and hands requests to idle workers from a pool.','Different requests run concurrently. Size the pool, queue excess work, and replace failed workers.'],
    ['Team','Peer workers pull requests from a shared queue. Specialized workers may use a separate pending-work queue.','Idle workers pick up new tasks. Lease assignments or make jobs safe to retry after a worker fails.'],
    ['Pipeline','Each stage does one kind of work and passes results through a queue to the next stage.','Different jobs occupy different stages. Replicate bottleneck stages, use backpressure, and retry or checkpoint stages where appropriate.']
  ])+p('Threads within one process share an address space. Surviving a process or host crash requires recovery outside that process, such as a durable queue and a replacement worker on another host.'),
  allocation: p('Processor allocation assigns processes to machines. In graph-theoretic deterministic allocation, vertices represent processes with known CPU and memory needs. An edge weight is the expected traffic between two processes.')+
    list('Build the weighted communication graph and determine machine capacities.',
      'Partition the vertices into one group per machine, keeping total CPU and memory within each capacity.',
      'For each feasible partition, sum only the weights crossing machine boundaries. Choose the smallest cut cost among the candidate partitions.')+
    p('Example: A–B carries 8 units, B–C carries 2, and A–C carries 1. Machine X can host two unit-size jobs and Y can host one.')+
    table(['Assignment','Traffic across machines'],[['A and B on X, C on Y','2 + 1 = <strong>3</strong>'],['A and C on X, B on Y','8 + 2 = 10'],['B and C on X, A on Y','8 + 1 = 9']])+p('Put A and B together. The method needs a reasonably stable workload estimate and the general partitioning problem is computationally hard.')
};
