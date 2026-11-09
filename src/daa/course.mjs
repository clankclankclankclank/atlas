import {QS,DIAGRAMS} from './papers.mjs';
import {NOTES,ORDER,TOPICS} from './notes.mjs';
export {QS,DIAGRAMS,NOTES,ORDER,TOPICS};
export const PAPERS={
 E1:{label:'2022 Autumn',pages:6},
 E2:{label:'2024 Autumn',pages:6},
 E3:{label:'2025 Spring · Minor',pages:4},
 E4:{label:'2024 Spring',pages:4},
 E5:{label:'2025 Autumn',pages:4},
 E6:{label:'2023 Spring',pages:4},
 E7:{label:'2023 Autumn',pages:4}
};
export const SCANS=Object.fromEntries(Object.entries(PAPERS).map(([id,{pages}])=>[id,Array.from({length:pages},(_,i)=>'assets/scans/'+id+'-'+String(i+1).padStart(2,'0')+'.jpg')]));
const F=(topic,title,equation,description,...refs)=>({topic,title,equation,description,refs});
export const FORMULA_ENTRIES=[
 F('Analysis','Tight asymptotic bound','c₁g(n) ≤ f(n) ≤ c₂g(n)','Choose positive constants and a threshold n₀.','E4-1(a)','E3-8(a)'),
 F('Analysis','Log of a factorial','log(n!) = Θ(n log n)','Bound the final half of the sum from below.','E4-1(c)','E5-1(f)'),
 F('Analysis','Halving loop sum','Σ ⌊n/2ᵈ⌋ = 2n − popcount(n)','This is the accumulated value. The iteration count is logarithmic.','E5-1(h)'),
 F('Analysis','Diophantine solvability','gcd(a,b) divides c','Use extended Euclid, then scale Bézout coefficients by c/g.','E3-2(b)'),
 F('Recurrences','Master threshold','p = log<sub>b</sub> a','Compare f(n) to nᵖ. Check regularity in the root-dominated case.','E1-1(c)','E1-8(a)','E4-2(a)'),
 F('Recurrences','Equal split level cost','aᵈ f(n/bᵈ)','For a power toll nᵏ, consecutive levels have ratio a/bᵏ.','E1-7(b)','E2-2(a)','E4-2(b)'),
 F('Recurrences','Unequal split depth','h<sub>min</sub> ≈ log<sub>1/r</sub> n · h<sub>max</sub> ≈ log<sub>1/s</sub> n','Use child fractions r≤s. For r+s=1 and a linear toll, complete levels cost Θ(n).','E5-2(b)','E3-2(a)','E1-8(b)'),
 F('Recurrences','Geometric sum','Σ<sub>i=0</sub><sup>h−1</sup> rⁱ = (rʰ−1)/(r−1)','When r=1 the sum is h.','E1-7(a)','E1-7(b)'),
 F('Sorting','Quicksort recurrence','T(n) = T(k) + T(n−1−k) + Θ(n)','One pass partitions. Extreme pivots make the full sort quadratic.','E2-2(b)','E4-1(i)','E2-6(b)'),
 F('Sorting','Randomized quicksort pair test','Pr[compare i,j] = 2/(j−i+1)','Use sorted ranks and condition on the first pivot in [i,j].','E4-3(b)'),
 F('Sorting','Heap array indices','left(i)=2i+1 · right(i)=2i+2','Zero-based indexing. Start bottom-up at ⌊n/2⌋−1.','E4-4(a)','E3-3(b)'),
 F('Sorting','Build max heap','Σ<sub>h≥0</sub> h·n/2ʰ⁺¹ = O(n)','The few highest nodes contribute little to the total.','E4-4(a)'),
 F('Dynamic','Longest common subsequence','L[i,j] = 1+L[i−1,j−1] if matched','Otherwise take max(up,left). Initialize row and column zero.','E5-6(a)','E1-2(b)','E3-5(b)'),
 F('Dynamic','Matrix chain','M[i,j] = minₖ(M[i,k]+M[k+1,j]+pᵢ₋₁pₖpⱼ)','Store the minimizing split. Fill by increasing chain length.','E1-2(a)','E3-1(j)','E4-5(b)'),
 F('Dynamic','0/1 knapsack','K[i,w] = max(K[i−1,w], vᵢ + K[i−1,w−wᵢ])','Take branch is available when wᵢ≤w.','E5-5(a)','E1-3(b)'),
 F('Dynamic','DAG shortest suffix','D[u] = min<sub>(u,v)</sub>(w(u,v)+D[v])','Start at the target and process in reverse topological order.','E2-5(a)'),
 F('Graphs','Floyd–Warshall','D[i,j] ← min(D[i,j], D[i,k]+D[k,j])','Outer loop is the allowed intermediate k.','E1-4(b)','E2-4(b)'),
 F('Graphs','Edge relaxation','d[v] ← min(d[v], d[u]+w(u,v))','Dijkstra settles the smallest tentative distance first.','E1-5(a)','E3-7(b)'),
 F('Graphs','Uniform MST weight shift','w′(T) = w(T)+(V−1)α','Spanning trees have the same number of edges.','E5-1(g)','E2-1(f)'),
 F('Graphs','DFS ancestor test','d[u] &lt; d[v] &lt; f[v] &lt; f[u]','An ancestor’s interval strictly contains a descendant’s.','E1-4(a)','E3-1(f)'),
 F('Greedy','Huffman expected length','L = Σ pᵢℓᵢ','Compare with ⌈log₂ k⌉ for k distinct symbols at fixed width.','E1-3(a)','E3-4(a)','E5-4(b)','E6-6(a)','E7-4(b)'),
 F('Greedy','Activity compatibility','sᵢ ≥ last finish','For half-open intervals. Sort by finish, not start.','E4-5(a)','E3-4(b)'),
 F('Amortized','Aggregate method','Amortized cost = total cost / operation count','Sum expensive geometric events across the sequence.','E2-5(b)','E5-3(b)'),
 F('Amortized','Potential method','ĉᵢ = cᵢ+Φᵢ−Φᵢ₋₁','The potential differences telescope.','E2-6(a)','E5-3(b)'),
 F('Complexity','NP-completeness','NP-complete = NP ∩ NP-hard','Prove both membership and reduction-based hardness.','E2-1(j)','E5-1(i)','E3-8(b)'),
 F('Complexity','CLIQUE certificate','Check k(k−1)/2 unordered pairs','A YES witness contains k distinct valid vertices.','E2-7(a)','E5-6(b)')
];
const Q=(title,why,...refs)=>({title,why,refs});
export const REPEATS=[
 Q('Recurrences and level work','Compute node sizes and costs, then bound the depth or geometric series.','E1-8(b)','E2-2(a)','E3-2(a)','E4-2(a)','E5-2(b)','E6-2(b)','E7-2(b)'),
 Q('Dynamic programming tables','Initialize the base cells and show the traceback or parenthesization.','E1-2(b)','E2-1(g)','E3-5(b)','E4-5(b)','E5-6(a)','E6-4(a)','E7-6(b)'),
 Q('Graph algorithms and MSTs','Show accepted edges or updated distances after each iteration.','E1-6(a)','E2-3(a)','E3-6(b)','E4-6(a)','E5-5(b)','E6-8(a)','E7-5(a)'),
 Q('Quicksort, heapify and selection','Write the invariant and distinguish one operation from the full sort.','E1-1(b)','E2-2(b)','E3-3(b)','E4-3(b)','E5-4(a)','E6-7(b)','E7-1(e)'),
 Q('Huffman code construction','List merge order, label branch bits and compute weighted length.','E1-3(a)','E2-1(d)','E3-4(a)','E5-4(b)'),
 Q('Certificates and NP reductions','State reduction direction, preserve yes/no answers and verify membership.','E1-1(e)','E2-7(b)','E3-8(b)','E4-6(b)','E5-6(b)','E6-8(b)','E7-8(a)'),
 Q('Geometric amortization','Charge repeated writes and sparse expensive events separately.','E2-5(b)','E2-6(a)','E5-3(b)')
];
