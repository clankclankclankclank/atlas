const entities = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&nbsp;':' '};
const speechTerms = {DFD:'D F D',UML:'U M L',SRS:'S R S',SDLC:'S D L C',XP:'X P',CASE:'case',COCOMO:'Cocomo',CPM:'C P M',PERT:'Pert',CFG:'C F G',KLOC:'thousand lines of code',UFP:'unadjusted function points'};

function plain(html) {
  return html.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|nbsp);/g,entity=>entities[entity])
    .replace(/\s+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
}
function spoken(text) {
  return text.replace(/\b(DFDs?|UML|SRS|SDLC|XP|CASE|COCOMO|CPM|PERT|CFG|KLOC|UFP)\b/g,
    term=>term==='DFDs'?'D F Ds':speechTerms[term])
    .replace(/\s*→\s*/g,', then ').replace(/\s*←\s*/g,' after ')
    .replace(/[×÷−≤≥]/g,char=>({'×':' times ','÷':' divided by ','−':' minus ','≤':' at most ','≥':' at least '})[char])
    .replace(/\s+/g,' ').trim();
}

export function audioStem(id) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
}

const diagramWalkthroughs = {
  "S1-3(a)": "Picture a system boundary with Member, Lending Staff, and Administrator outside it. Link Member to search, borrow, return or renew, pay fines, and read reserved copies. Lending Staff records loans, returns and fine payments. The Administrator maintains the catalogue.",
  "S1-4(b)": "At the context level, put the Judiciary Information System in one box. Link it to the Registrar, Judge and Lawyer through the labelled case, hearing and fee exchanges. At level one, split it into registering cases, managing hearings, closing cases, archive access and report generation. Connect the first three to the case and hearing stores, and record archive access charges in the charges store.",
  "S1-4(c)": "Put the Judiciary controller at the root. Give it five children: register case, manage hearings, close case, archive access, and generate reports. Below register case, validate input and assign a case identification number. Below manage hearings, find and reserve a slot. Below close case, store the judgment and update case status.",
  "S2-3(a)": "The patient sends demographics to registration, which creates a patient ID. The health worker sends observations to the checkup process, which reads patient history and stores the new checkup. The admin sends reporting criteria, and the report process reads stored checkups and produces a report and an admin summary.",
  "S3-4(a)": "In the context diagram, use one food ordering system with Customer, Kitchen, Manager, and Supplier outside. In level one, capture the order, send an order ticket to the kitchen, receive its preparation status, and send the customer a bill and status. Use stock information to raise purchase orders and update it when the supplier confirms. Send reports to the manager and accept menu updates.",
  "S3-6(b)": "Start with the candidate and administrator outside one online examination process. In level one, split the system into authenticate and enroll, schedule and set the paper, conduct and grade, and report and certify. Use three stores: students and enrollment, schedules and papers, and answers and grades.",
  "S4-4(b)": "For the class view, start with the customer and the purchase or upgrade transaction. Give the transaction links to the DVD being purchased and the existing item relevant to eligibility. For the sequence view, read the interaction from top to bottom: the customer requests the upgrade, the system checks eligibility, Support presents compatible options, the customer selects a DVD, and Mail ships it. The customer installs it and sends payment to Accounts after successful installation.",
  "S4-5(a)": "At context level, connect the shop system to customer, supplier and manager. At level one, show catalogue maintenance, receiving supplies, recording sales, reorder and expiry, and financial reports. At level two, break reorder and expiry into estimating weekly demand, comparing usable stock, grouping expired batches by vendor, and building the order list.",
  "S5-1(a)": "Draw a customer sending an order to one process and receiving confirmation. At level one, replace the single process with order validation and confirmation, with an orders data store, while keeping the same order input and confirmation output at the boundary.",
  "S5-7(a)": "Draw the supermarket as one context process exchanging item codes, quantities and bills with the sales clerk, supply updates with the inventory employee, and reports and price changes with the manager. At level one, separate sales, stock maintenance, inventory or sales reporting, and price changes. In the sale decomposition, validate and price the items, total and commit the sale, and print the bill.",
  "S5-8(a)": "Model books and members in separate registers. A loan links one member to one book copy. A member may have multiple loans, with at most five active loans. Reference books remain for library use. A book copy can have several past loan records, with at most one active loan at a time."
};

export function narrationFor(question) {
  const answer = question.ahtml
    .replace(/<svg\b[\s\S]*?<\/svg>/gi,' ')
    .replace(/<figcaption\b[\s\S]*?<\/figcaption>/gi,' ')
    .replace(/<table\b[\s\S]*?<\/table>/gi,table=>{
      const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([,row])=>
        [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([,cell])=>plain(cell)));
      const [headers,...body]=rows;
      return headers?.length ? body.map(row=>row.map((cell,i)=>
        headers[i] ? headers[i]+': '+cell : cell).join('. ')).join('. ') + '.' : '';
    })
    .replace(/<\/(?:p|li|h[1-6]|pre|figure)>/gi,'\n');
  const paragraphs=answer.split(/\n+/).map(line=>spoken(plain(line))).filter(Boolean);
  const diagram=diagramWalkthroughs[question.id];
  if(diagram)paragraphs.push(spoken(diagram));
  return 'Question. '+spoken(question.question)+'\n\nAnswer. '+paragraphs.join('\n\n');
}

export function speechChunks(text) {
  return text.split(/\n+/).filter(Boolean).flatMap(paragraph=>
    paragraph.match(/.{1,205}(?:\s|$)|\S+/gu)?.map(chunk=>chunk.trim()).filter(Boolean)??[]);
}
