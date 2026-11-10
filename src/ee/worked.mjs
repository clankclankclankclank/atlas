import {depreciationSchedule} from './depreciation.mjs';
import {expandFactors,factorEntry} from './factor-expansion.mjs';

const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const num=(n,d=2)=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:d}).format(Math.abs(n)<1e-10?0:n);
const A=(i,n)=>(1-(1+i)**-n)/i;
const F=(i,n)=>((1+i)**n-1)/i;
const G=(i,n)=>1/i-n/((1+i)**n-1);
const disc=(i,t)=>(1+i)**-t;
const npv=(cash,i)=>cash.reduce((v,c,t)=>v+c*disc(i,t),0);
const sum=a=>a.reduce((v,x)=>v+x,0);
const fmtPct=x=>num(x*100,4)+'%';
const p=s=>'<p>'+s+'</p>';
const eq=s=>'<p class="ee-equation">'+s+'</p>';
const isNumber=x=>/^[₹$+−-]?\d[\d,.]*(?:%|(?:\.\d+)?\s+units)?$/.test(String(x));
const table=(heads,rows)=>'<div class="ee-table" role="region" aria-label="Worked calculation table" tabindex="0"><table><thead><tr>'+heads.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((c,i)=>i===0?'<th scope="row"'+(isNumber(c)?' data-num':'')+'>'+esc(c)+'</th>':'<td'+(isNumber(c)?' data-num':'')+'>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const step=(label,body)=>({label,html:body});
const steps=(...items)=>items.map(([label,body])=>step(label,body));
const solutions=new Map();
function add(id,result,steps,question){
 if(solutions.has(id))throw new Error('Duplicate EE solution '+id);
 const lead='<p class="ee-result"><small>FINAL ANSWER</small><strong>'+esc(result)+'</strong></p>';
 const ahtml=lead+steps.map((s,i)=>'<section class="ee-step"><h3><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(s.label)+'</h3>'+s.html+'</section>').join('');
 solutions.set(id,{result,steps,ahtml,question});
}
const ann=(initial,annual,salvage,n)=>[-initial,...Array.from({length:n},(_,i)=>annual+(i===n-1?salvage:0))];
const projectTimeline=(rows,unit)=>table(['When','Cash flow ('+unit+')','Treatment'],rows);
function pw(id,i,n,projects,unit){
 const factor=A(i,n),single=disc(i,n);
 const out=projects.map(([name,p,a,s])=>({name,p,a,s,pva:a*factor,pvs:s*single,pw:-p+a*factor+s*single}));
 const best=[...out].sort((a,b)=>b.pw-a.pw)[0], decision=best.pw>=0?'Choose '+best.name:'Choose '+best.name+' if compulsory. Otherwise reject both.';
 add(id,decision,steps(
 ['Put every amount at year 0',projectTimeline([['0',projects.map(([nm,p])=>nm+': −'+p).join(' / '),'Pay initial cost'],['1–'+n,projects.map(([nm,p,a])=>nm+': +'+a+' yearly').join(' / '),'Discount a uniform series'],[String(n),projects.map(([nm,p,a,s])=>nm+': +'+s).join(' / '),'Discount salvage separately']],unit)+eq('PW = −P + A(P/A, i, n) + S(P/F, i, n)')],
 ['Calculate the two factors',eq('(P/A, '+fmtPct(i)+', '+n+') = [1 − (1 + '+i+')<sup>−'+n+'</sup>] / '+i+' = '+num(factor,7))+eq('(P/F, '+fmtPct(i)+', '+n+') = (1 + '+i+')<sup>−'+n+'</sup> = '+num(single,7))+expandFactors([['P/A',i,n,factor],['P/F',i,n,single]],[['Project calculator entry','-'+projects[0][1]+' + '+projects[0][2]+' * ('+factorEntry('P/A',i,n)+') + '+projects[0][3]+' * ('+factorEntry('P/F',i,n)+')']])],
 ['Substitute and compare',table(['Project','Initial ('+unit+')','PW of receipts','PW of salvage','Net PW'],out.map(x=>[x.name,...[-x.p,x.pva,x.pvs,x.pw].map(z=>num(z,5))]))+out.map(x=>eq('PW('+x.name+') = −'+x.p+' + '+x.a+'('+num(factor,7)+') + '+x.s+'('+num(single,7)+') = '+num(x.pw,5)+' '+unit)).join('')+p('Choose the higher net present worth. A zero-worth do-nothing alternative outranks either project when both PWs are negative.') ]));
}
function bcCompare(id,i,projects,unit){
 const out=projects.map(([name,p,a,n])=>({name,p,a,n,f:A(i,n),b:a*A(i,n),aw:p/A(i,n)}));
 const [a,b]=out, same=a.n===b.n, ca=same?a.p:a.aw, cb=same?b.p:b.aw, ba=same?a.b:a.a, bb=same?b.b:b.a;
 const r1=a.b/a.p,r2=b.b/b.p,delta=(bb-ba)/(cb-ca),bothBad=r1<1&&r2<1,best=bothBad?a.name:delta>=1?b.name:a.name;
 add(id,bothBad?'Reject both. If forced to choose, prefer '+best+'.':'Choose '+best+' on the comparable-service basis.',steps(
 ['Compute each stand-alone B/C',eq('B/C = A(P/A, '+fmtPct(i)+', n) / P')+table(['Alternative','Life','P/A','PV benefits ('+unit+')','PV cost','B/C'],out.map(x=>[x.name,x.n,num(x.f,7),num(x.b,5),x.p,num(x.b/x.p,5)]))+p('Each ratio screens that alternative against doing nothing. For mutually exclusive options use the incremental comparison.')],
 ['Put the alternatives on the same basis',p(same?'Lives are equal, so compare the differences at year 0.':'The lives are unequal. For repeatable comparable service, compare annual equivalents. If the options are one-off projects, specify a common study horizon and how service or residual values beyond the shorter life are handled.')+eq(same?'ΔB = '+num(bb,6)+' − '+num(ba,6)+' = '+num(bb-ba,6):'Annual capital cost = P / (P/A, i, n)')+table(['Alternative','Comparable benefit','Comparable cost'],[[a.name,num(ba,6),num(ca,6)],[b.name,num(bb,6),num(cb,6)]])],
 ['Test the upgrade',eq('ΔB/C = ('+num(bb,6)+' − '+num(ba,6)+') / ('+num(cb,6)+' − '+num(ca,6)+') = '+num(delta,6))+p(bothBad?'Neither alternative pays for itself. If choice is compulsory, the incremental ratio is below one, so stay with the lower-cost alternative.':delta>=1?'Every extra unit of comparable cost buys more than one unit of extra benefit, so the upgrade is justified.':'The extra benefit does not cover the extra cost, so keep the lower-cost alternative.') ]));
}
function bcPW(id,i,initial,benefits,operations,salvage,n,unit,lead=''){
 const rows=benefits.map(([name,cash])=>[name,cash,num(sum(cash.map((v,j)=>v*disc(i,j+1))),6)]);
 const b=sum(benefits.map(([,cash])=>sum(cash.map((v,j)=>v*disc(i,j+1)))))+salvage*disc(i,n);
 const c=initial+operations*A(i,n), r=b/c;
 add(id,'B/C = '+num(r,5)+' · '+(r>=1?'accept':'reject'),steps(
 ['Lay out the cash flows',p(lead)+projectTimeline([['0','−'+initial,'Initial construction cost'],['1–'+n,'−'+operations+' per year','Operating and maintenance costs'],[String(n),'+'+salvage,'Terminal receipt, if any']],unit)+table(['Benefit stream','Year 1','Year '+n],rows.map(([nm,cash])=>[nm,cash[0],cash.at(-1)]))],
 ['Discount benefits and costs separately',eq('(P/A, '+fmtPct(i)+', '+n+') = '+num(A(i,n),7)+' · (P/F, '+fmtPct(i)+', '+n+') = '+num(disc(i,n),7))+expandFactors([['P/A',i,n,A(i,n)],['P/F',i,n,disc(i,n)]])+table(['Cash-flow component','Calculation','PW ('+unit+')'],[...rows.map(([nm,cash,v])=>[nm,cash.every(z=>z===cash[0])?cash[0]+' × '+num(A(i,n),7):'Σ Bₜ/(1+i)ᵗ',v]),['Salvage',salvage+' × '+num(disc(i,n),7),num(salvage*disc(i,n),6)],['Initial cost','Already at time 0',num(initial,6)],['Annual O&M',operations+' × '+num(A(i,n),7),num(operations*A(i,n),6)]])],
 ['Apply the B/C test',eq('PW(B) = '+num(b,6)+' · PW(C) = '+num(c,6)+' '+unit)+eq('B/C = '+num(b,6)+' / '+num(c,6)+' = '+num(r,6))+p(r>=1?'At the stated discount rate, present benefits exceed present costs. The project is justified under the supplied assumptions.':'At the stated discount rate, present benefits fall short of present costs. Reject on these cash flows.') ]));
}
function irrBetween(cash){
 let lo=0,hi=1;
 if(npv(cash,lo)<0||npv(cash,hi)>0)throw Error('Missing positive IRR bracket');
 for(let j=0;j<70;j++){let m=(lo+hi)/2;if(npv(cash,m)>0)lo=m;else hi=m;}
 return (lo+hi)/2;
}
function irrParts(cash,rate,unit,compareRate){
 const lo=Math.floor(rate*100)/100,hi=lo+.01,nl=npv(cash,lo),nh=npv(cash,hi),guess=lo+nl/(nl-nh)*(hi-lo);
 return steps(
 ['Write the year-by-year cash flows',table(['Year','Net cash flow ('+unit+')'],cash.map((c,t)=>[t,num(c,6)]))+eq('NPV(r) = Σ CFₜ / (1+r)<sup>t</sup> = 0')],
 ['Bracket the sign change',table(['Trial discount rate','NPV ('+unit+')'],[...(compareRate==null?[]:[[fmtPct(compareRate)+' (MARR)',num(npv(cash,compareRate),6)]]),[fmtPct(lo),num(nl,6)],[fmtPct(hi),num(nh,6)]])+p('The trial NPV is positive at the lower rate and negative at the higher rate. With one initial outflow followed by positive receipts, the NPV decreases with the discount rate.')],
 ['Interpolate, then verify',eq('r ≈ rₗ + [NPVₗ / (NPVₗ − NPVₕ)](rₕ − rₗ)')+eq('r ≈ '+fmtPct(lo)+' + ['+num(nl,6)+' / ('+num(nl,6)+' − ('+num(nh,6)+'))] × 1 percentage point = '+fmtPct(guess))+p('Refining the zero of the original NPV equation gives '+fmtPct(rate)+'.'+(compareRate==null?'':' Compared with the '+fmtPct(compareRate)+' MARR, '+(rate>=compareRate?'accept':'reject')+' the investment.'))]);
}
function reg(id,xs,ys,targets,unit){
 const xbar=sum(xs)/xs.length,ybar=sum(ys)/ys.length, dx=xs.map(x=>x-xbar);
 const xx=sum(dx.map(x=>x*x)),xy=sum(dx.map((x,j)=>x*ys[j])),b=xy/xx;
 const pred=targets.map(x=>ybar+b*(x-xbar));
 add(id,targets.map((x,j)=>x+' → '+num(pred[j],4)).join(' · ')+' '+unit,steps(
 ['Center the observations',eq('x̄ = '+num(sum(xs),6)+' / '+xs.length+' = '+num(xbar,6)+' · ȳ = '+num(sum(ys),6)+' / '+ys.length+' = '+num(ybar,6))+p('Use d = x−x̄, so Σd=0 and Σd(y−ȳ)=Σdy.')+table(['x','y','d=x−x̄','d²','dy'],[...xs.map((x,j)=>[x,ys[j],num(dx[j],6),num(dx[j]**2,6),num(dx[j]*ys[j],6)]),['Total',sum(ys),0,num(xx,6),num(xy,6)]] )],
 ['Fit the trend line',eq('b = Σdy / Σd² = '+num(xy,6)+' / '+num(xx,6)+' = '+num(b,8))+eq('ŷ = '+num(ybar,8)+' + ('+num(b,8)+')(x − '+num(xbar,6)+')')+p('The least-squares line passes through (x̄,ȳ), which checks the intercept form.')],
 ['Substitute the requested inputs',table(['x','x−x̄','Calculation','Forecast ('+unit+')'],targets.map((x,j)=>[x,num(x-xbar,6),num(ybar,8)+' + ('+num(b,8)+') × ('+num(x-xbar,6)+')',num(pred[j],4)]))+p(targets.some(t=>t>Math.max(...xs)||t<Math.min(...xs))?'These are extrapolations. They assume the fitted linear trend continues beyond the observed range.':'The forecast is interpolation inside the observed range.') ]));
}
function depreciation(label,P,S,n,method,i,unit){
 const {schedule,expansion,uniform,balance:bv}=depreciationSchedule(P,S,n,method,i,unit);
 const rule=method==='SL'?'D = (P − S)/n = ('+num(P)+' − '+num(S)+') / '+n+' = '+num(uniform):
 method==='SF'?'A = (P − S)/(F/A,i,n) = ('+num(P)+' − '+num(S)+') / '+num(F(i,n),7)+' = '+num(uniform):
 'Dₜ = '+fmtPct(i)+' × opening BV, capped at opening BV − '+num(S);
 return {label,rule,unit,uniform,bv,method,steps:steps(
 ['Set the depreciation rule',eq(rule)+expansion+p(method==='SF'?'A is the fixed fund deposit. This year’s net depreciation is A plus interest on the fund accumulated by last year. Equivalent form: Dₜ=A(1+i)<sup>t−1</sup>.':method==='SL'?'Subtract the same annual depreciation from the opening book value every year.':'Use the same percentage on a changing opening book value. A salvage floor only stops the book value from falling below the specified salvage.')],
 ['Build the full yearly schedule',schedule+p('Accumulated depreciation = purchase cost − closing book value. The table displays rounded figures but keeps full precision during calculation.')],
 ['Check the last row',eq('Closing book value after '+n+' years = '+num(bv)+' '+unit)+p(method==='DB'?'A fixed-rate declining balance schedule may end above salvage. Adjust the final year only if the question requires the terminal book value to equal salvage.':'The ending book value equals the specified salvage value.')])};
}
function breakEven(P,V,fc,q){
 const c=P-V,r=c/P,b=fc/c;
 return {P,V,fc,q,c,r,b,be:b*P,pr:q*c-fc,mos:q-b};
}
const breakSetup=z=>eq('Contribution/unit = P − V = '+num(z.P)+' − '+num(z.V)+' = ₹'+num(z.c))+eq('P/V ratio = '+num(z.c)+'/'+num(z.P)+' = '+fmtPct(z.r))+eq('BEP units = '+num(z.fc)+'/'+num(z.c)+' = '+num(z.b,6)+' · BEP sales = '+num(z.fc)+'/'+num(z.r,6)+' = ₹'+num(z.be));
const safety=z=>table(['Method','Substitution','Margin of safety'],[['Units','Actual units − BEP = '+num(z.q)+' − '+num(z.b,6),num(z.mos,6)+' units'],['Revenue','Actual revenue − break-even revenue = '+num(z.P*z.q)+' − '+num(z.be),'₹'+num(z.mos*z.P)],['Profit / P/V ratio',num(z.pr)+' / '+num(z.r,6),'₹'+num(z.pr/z.r)],['Percentage','MOS units / actual units × 100',fmtPct(z.mos/z.q)]]);
const plot=(caption,x,y,curves,labels=[])=>'<figure class="ee-figure"><svg viewBox="0 0 440 232" role="img" aria-label="'+esc(caption)+'"><path class="ee-axis" d="M48 20V188H417"/><text x="8" y="17">'+esc(y)+'</text><text x="320" y="217">'+esc(x)+'</text>'+curves.map(([d,style],i)=>'<path class="ee-curve '+(style??'ee-series-'+(i%4))+'" d="'+d+'"/>').join('')+labels.map(([x,y,t])=>'<text x="'+x+'" y="'+y+'">'+esc(t)+'</text>').join('')+'</svg><figcaption>'+esc(caption)+'</figcaption></figure>';
const graphLine=(f,lo,hi,x,y,samples=50)=>Array.from({length:samples+1},(_,j)=>{const q=lo+(hi-lo)*j/samples;return (j?'L':'M')+x(q).toFixed(2)+' '+y(f(q)).toFixed(2);}).join(' ');
const costPlot=(()=>{
 const x=q=>48+17*q,y=c=>188-1.32*c;
 const avc=q=>28-3.6*q+.18*q*q,mc=q=>28-7.2*q+.54*q*q,atc=q=>avc(q)+300/q;
 const q1=10;let lo=10,hi=20;
 for(let i=0;i<36;i++){let q=(lo+hi)/2;if(mc(q)<atc(q))lo=q;else hi=q;}
 const q2=(lo+hi)/2;
 return plot('In this cost example MC crosses AVC and ATC exactly at their respective minima. The vertical distance between ATC and AVC is AFC.','Output Q','Cost/unit',[[graphLine(atc,3,20,x,y)],[graphLine(avc,0,20,x,y)],[graphLine(mc,0,20,x,y)],['M'+x(q1)+' '+y(avc(q1))+'V188 M'+x(q2)+' '+y(atc(q2))+'V188','ee-dashed']],[[x(20)+5,y(atc(20))+2,'ATC'],[x(20)+5,y(avc(20))+2,'AVC'],[x(20)+5,y(mc(20))+2,'MC'],[x(q1)-16,205,'min AVC'],[x(q2)-9,205,'min ATC']]);
})();
const productionPlot=(()=>{
 const x=l=>48+39*l,y=v=>156-4.5*v,ap=l=>5+2*l-.2*l*l,mp=l=>5+4*l-.6*l*l;
 const cross=5,zero=(4+Math.sqrt(28))/1.2;
 return plot('The MP peak comes first. Stage II begins at MP=AP and ends at MP=0. The horizontal dashed line marks zero product.','Variable input L','Product',[[graphLine(ap,0,8.65,x,y)],[graphLine(mp,0,8.65,x,y)],['M48 156H414 M'+x(cross)+' '+y(ap(cross))+'V188 M'+x(zero)+' 156V188','ee-dashed']],[[130,182,'I'],[276,182,'II'],[380,182,'III'],[x(8.65)+3,y(ap(8.65)),'AP'],[x(8.65)+3,y(mp(8.65)),'MP'],[x(cross)+3,y(ap(cross))-10,'MP = AP']]);
})();
const returnsPlot=plot('Output compared with proportional scaling of all inputs.','Input scale t','Output',[['M48 188 Q266 177 376 29'],['M48 188L377 66'],['M48 188 Q138 108 377 106']],[[383,30,'IRS'],[383,68,'CRS'],[383,107,'DRS']]);
const inflationPlots=plot('Demand-pull: AD shifts right. Equilibrium price and real output rise.','Real output','Price level',[['M62 40L285 170'],['M135 35L389 170'],['M76 173L345 32']],[[289,173,'AD₀'],[393,173,'AD₁'],[350,35,'SRAS']])+plot('Cost-push: SRAS shifts left. Equilibrium price rises and real output falls.','Real output','Price level',[['M69 35L380 171'],['M96 175L375 41'],['M55 140L286 27']],[[385,172,'AD'],[373,39,'SRAS₀'],[276,25,'SRAS₁']]);
const taxPlot=(q0,q1,p0,pc,ps,rate)=>{
 const ql=q1-(q0-q1)*.65,qr=q0+(q0-q1)*.7;
 const x=q=>114+(q-ql)/(qr-ql)*252;
 const demand=q=>p0+(q-q0)*(pc-p0)/(q1-q0),supply=q=>p0+(q-q0)*(ps-p0)/(q1-q0),withTax=q=>pc+(q-q1)*(ps-p0)/(q1-q0)*(1+rate);
 const spread=Math.max(...[demand,supply,withTax].flatMap(f=>[Math.abs(f(ql)-p0),Math.abs(f(qr)-p0)]));
 const y=v=>102-(v-p0)*72/spread;
 const x1=x(q1),x0=x(q0),yC=y(pc),yS=y(ps);
 return plot('Demand meets post-tax supply at (Q₁,Pᶜ). Original supply at Q₁ gives Pˢ. The difference Pᶜ−Pˢ is the per-unit tax.','Quantity','Price',[[graphLine(demand,ql,qr,x,y,2)],[graphLine(supply,ql,qr,x,y,2)],[graphLine(withTax,ql,qr,x,y,2)],['M'+x1+' '+yC+'V188 M'+x0+' 102V188 M48 '+yC+'H'+x1+' M48 102H'+x0+' M48 '+yS+'H'+x1,'ee-dashed'],['M'+x1+' '+yC+'V'+yS,'ee-series-3']],[[54,yC-4,'Pᶜ '+num(pc)],[54,98,'P₀ '+num(p0)],[54,yS+14,'Pˢ '+num(ps)],[x1-21,205,'Q₁ '+num(q1)],[x0-15,205,'Q₀ '+num(q0)],[373,y(demand(qr))+3,'D'],[373,y(supply(qr))+3,'S'],[373,Math.max(15,y(withTax(qr))+3),rate?'S + 30%':'S + ₹100']]);
};
const mosPlot=z=>{
 const x=q=>48+336*q/(z.q*1.11), max=z.q*z.P*1.18, y=r=>188-160*r/max, be=x(z.b), act=x(z.q),top=y(z.q*z.P);
 return plot('The horizontal distance from break-even to actual output is the margin of safety.','Units sold','Revenue / cost',[['M48 188L'+act+' '+top],['M48 '+y(z.fc)+'L'+act+' '+y(z.fc+z.V*z.q)],['M'+be+' '+y(z.be)+'V188 M'+act+' '+top+'V188','ee-dashed'],['M'+be+' 172H'+act,'ee-series-3']],[[act+9,top,'TR'],[act+9,y(z.fc+z.V*z.q),'TC'],[be-17,y(z.be)-7,'BEP'],[be-10,207,num(z.b)],[act-12,207,num(z.q)],[(be+act)/2-16,168,'MOS']]);
};

const consumerPlot=plot('With prices fixed, a rise in income shifts the budget line outward in parallel. A fall in Pₓ rotates it around the Y-intercept.','Good X','Good Y',[['M48 85L239 188'],['M48 41L320 188'],['M48 85L342 188']],[[118,117,'Original'],[115,54,'Higher income'],[303,165,'Lower Pₓ']]);
const isoPlot=(()=>{
 const x=l=>48+25*l,y=k=>188-11*k;
 return plot('Example with w=r=1, C=12 and Q=√(LK). The budget line touches Q=6 at L=K=6. Q=8 is beyond the budget.','Labour L','Capital K',[[graphLine(l=>12-l,0,12,x,y,2)],[graphLine(l=>16/l,1.15,13.7,x,y)],[graphLine(l=>36/l,2.48,13.7,x,y)],[graphLine(l=>64/l,4.40,13.7,x,y)],['M198 122V188 M48 122H198','ee-dashed']],[[351,189,'C=12'],[397,180,'Q=4'],[397,160,'Q=6'],[397,138,'Q=8'],[204,119,'E']]);
})();
const isoSteps=steps(
 ['Draw the isocost',eq('C = wL + rK ⇒ K = C/r − (w/r)L')+table(['Feature','Value'],[['Capital intercept','C/r'],['Labour intercept','C/w'],['Slope','−w/r']])+p('Each point on this line costs exactly C. Parallel outward shifts represent larger budgets at unchanged factor prices.')],
 ['Output maximization and cost minimization',isoPlot+table(['Objective','Held fixed','What to look for'],[['Maximize output','Budget C','Highest isoquant the isocost can reach'],['Minimize cost','Target output Q','Lowest isocost that reaches the target isoquant']])],
 ['Check the interior optimum',eq('MRTSₗₖ = MPₗ/MPₖ = w/r ⇔ MPₗ/w = MPₖ/r')+p('If labour gives more output per rupee, move spending toward labour until the ratios equalize. With convex isoquants the tangency gives the interior optimum. Check corner bundles when no interior tangency is feasible.')]);
const fiscalSteps=steps(
 ['Diagnose demand pressure',p('If planned spending grows faster than productive capacity, aggregate demand pulls the price level up. Contractionary fiscal policy aims to moderate this excess demand.')],
 ['Use government spending and tax instruments',table(['Instrument','Direct effect','Inflation channel'],[['Reduce or defer discretionary government purchases','G falls','AD shifts left'],['Raise selected net taxes','Disposable income falls','Consumption demand weakens'],['Reduce broad transfers or subsidies that sustain excess demand','Household spending capacity falls','Demand pressure eases'],['Reduce the deficit through spending or revenue changes','Government net spending declines','Overall demand stimulus weakens']])],
 ['Address supply pressure separately',p('An energy shortage can raise prices while output falls. Targeted logistics or supply measures can improve capacity. A broad demand cut can slow inflation but also reduce output and employment in the short run.')]);
const inflationSteps=steps(
 ['Demand-pull inflation',p('Households, firms, government, or foreign buyers spend more at the existing price level. With an upward-sloping short-run aggregate supply curve, AD shifts right, and both equilibrium price and output rise.')],
 ['Cost-push inflation',p('Input costs rise or productive capacity falls. At each price firms supply less, so SRAS shifts left. The new equilibrium has a higher price level and lower real output.')],
 ['Draw and distinguish the two mechanisms',inflationPlots+table(['Type','Curve shift','Price level','Output','Example'],[['Demand-pull','AD right','Rises','Rises','Credit-fueled demand near capacity'],['Cost-push','SRAS left','Rises','Falls','Fuel import price shock']])]);
const productionSteps=steps(
 ['Define TP, AP and MP',eq('TP = Q(L) · AP = Q(L)/L · MP = dQ/dL')+p('Hold capital and technology fixed. A fall in MP means the TP curve is getting flatter, while TP still rises as long as MP remains positive.')],
 ['Mark the stage boundaries',productionPlot+table(['Stage','AP and MP','What TP does'],[['I','AP rises while MP > AP','Rises. It can switch from increasing to diminishing increments within Stage I.'],['II','AP falls, 0 < MP < AP','Rises at a decreasing rate. Stage II ends where MP=0.'],['III','MP < 0','Falls as more variable input is added.']])],
 ['Use an example and explain the relevant range',table(['Workers','TP (units)','AP','MP from previous worker'],[[1,8,8,8],[2,20,10,12],[3,33,11,13],[4,44,11,11],[5,50,10,6],[6,50,8.33,0],[7,48,6.86,-2]])+p('The table has maximum average product at 3–4 workers and maximum total product at 5–6. Stage II is the usual economically relevant interior range. The exact profit-maximizing input needs the input and output prices.')]);
const returnsSteps=steps(
 ['Scale all factors together',eq('Compare f(tL,tK) with t·f(L,K), for t > 1.')+p('This is a long-run exercise. The proportions of inputs stay fixed while their common scale changes.')],
 ['Compare the three outcomes',table(['Case','Test','Example if inputs double'],[['Increasing','f(tL,tK) > tQ','100 → 250'],['Constant','f(tL,tK) = tQ','100 → 200'],['Decreasing','f(tL,tK) < tQ','100 → 150']])+returnsPlot],
 ['Explain the slope comparison',p('Increasing returns can arise from specialization. Constant returns mean capacity expands proportionately. Decreasing returns can arise from coordination or other scale constraints. In Cobb–Douglas Q=ALᵅKᵝ the test is whether α+β is above, equal to, or below 1.')]);
add('E1-2(a)','The income effect changes purchasing power. The price effect combines income and substitution effects.',steps(
 ['Define and contrast',table(['Effect','What changes','Budget line','Observed response'],[['Income effect','Purchasing power, with prices held fixed in the isolated experiment','Parallel shift','Consumption adjusts at the same relative prices'],['Price effect','Own price while money income and other prices stay fixed','Pivots around the unchanged intercept','Consumption responds to relative prices and purchasing power']])+consumerPlot],
 ['Decompose a fall in own price',p('For a price fall, the good becomes relatively cheaper. The substitution effect raises consumption of that good under standard preferences. Real purchasing power also increases. The resulting income effect raises quantity for a normal good and reduces it for an inferior good.')],
 ['Give a numerical budget example',eq('Budget: 10X + 10Y = 100 · intercepts (10,0) and (0,10)')+p('Income rising to 120 gives intercepts 12 and 12. Instead, falling Pₓ to 5 at income 100 gives intercepts 20 and 10. The first change is a parallel shift. The second is a pivot.') ]));
reg('E1-2(b)',[2003,2004,2005,2006,2007,2008,2009],[15,25,30,45,50,55,62],[2010,2012],'thousand');
add('E1-3(a)','Interior equilibrium is where marginal product per rupee is equal across inputs.',isoSteps);
add('E1-3(b)','TFC = 100. AC is minimized at Q = 10. MC is increasing.',steps(
 ['Get fixed, average and marginal cost',table(['Measure','Rule','Result'],[['TFC','TC(0)','100'],['AC','TC/Q, Q>0','100/Q + 5 + Q'],['MC','dTC/dQ','5 + 2Q']])],
 ['Minimize average cost',eq('dAC/dQ = −100/Q² + 1 = 0 ⇒ Q² = 100 ⇒ Q = 10')+eq('d²AC/dQ² = 200/Q³ > 0 · AC(10) = MC(10) = 25')+p('The negative root is infeasible. Equality with MC checks the AC minimum.')],
 ['Check marginal cost at the boundary',eq('dMC/dQ = 2 > 0')+p('There is no positive interior minimizer. On Q≥0 the minimum is MC(0)=5. If only positive integer output counts, the smallest feasible output is 1 and MC(1)=7.') ]));
pw('E1-4(a)',.16,17,[['A',50,3,.03],['B',65,5,.05]],'₹ lakh');
{
 const i=.18,n=20,f=F(i,n),g=(1+i)**n;
 const m=[[1,20,1],[2,15,1.5]];
 add('E1-4(b)','Choose Machine 2. Its year-20 future cost is lower.',steps(
 ['Set a common comparison date',p('Both machines provide 20 years of service. Move the purchase cost from year 0 and every end-of-year O&M payment to year 20.')+eq('FW(cost) = P(F/P,i,n) + A(F/A,i,n)')],
 ['Compute the factors',eq('(F/P) = 1.18²⁰ = '+num(g,7)+' · (F/A) = (1.18²⁰ − 1)/0.18 = '+num(f,7))+expandFactors([['F/P',i,n,g],['F/A',i,n,f]])],
 ['Calculate and select',table(['Machine','Purchase FW (₹ lakh)','O&M FW','Total FW cost'],m.map(([k,p,a])=>[k,num(p*g,5),num(a*f,5),num(p*g+a*f,5)]))+eq('Machine 1: 20('+num(g,7)+') + 1('+num(f,7)+') = '+num(20*g+f,5))+eq('Machine 2: 15('+num(g,7)+') + 1.5('+num(f,7)+') = '+num(15*g+1.5*f,5))+p('For equal benefits, minimize cost. No salvage was supplied.') ]));
}
bcCompare('E1-5(a)',.10,[['A',35,8.5,10],['B',40,9,12]],'₹ lakh');
{
 const z=depreciation('Declining balance',200000,0,5,'DB',.25,'₹');
 add('E1-5(b)','Year-5 depreciation ₹15,820.31 · year-5 book value ₹47,460.94.',[step('Work the first two years',eq('Year 1: 0.25 × 2,00,000 = ₹50,000 · BV = ₹1,50,000')+eq('Year 2: 0.25 × 1,50,000 = ₹37,500 · BV = ₹1,12,500')),...z.steps]);
}
add('E1-6(a)','Inflation can result from excess demand, higher costs, or supply constraints.',steps(
 ['Separate demand from supply',p('Inflation is a sustained increase in the general price level. An isolated increase in one price is a relative-price change. Economy-wide demand increases or supply constraints can generate broader price pressure.')],
 ['Explain five channels',table(['Cause','Mechanism','Example'],[['Excess aggregate demand','Spending grows faster than productive capacity','A credit boom lifts consumption'],['Wages outpace productivity','Unit labour cost rises','Wages grow while output per worker is flat'],['Raw-material or energy shock','Input costs raise marginal costs','Oil price spike lifts freight and power costs'],['Currency depreciation','Imported goods and inputs cost more domestically','A weaker rupee raises local fuel costs'],['Supply bottlenecks','Firms cannot supply previous output at the same cost','Crop failure or port disruption']])],
 ['Connect them to a diagram',inflationPlots+p('Expect output to rise in a demand-pull shift and fall in an adverse short-run supply shift, all else equal.') ]));
add('E1-6(b)','Reduce excessive aggregate demand with a contractionary fiscal stance.',fiscalSteps);
add('E2-2(a)','Robusta demand falls 4.2%. The second cross elasticity is −0.25.',steps(
 ['Read the sign and calculate the first change',eq('E<sub>R,A</sub> = %ΔQ<sub>Robusta</sub> / %ΔP<sub>Arabica</sub>')+eq('%ΔQ<sub>Robusta</sub> = (−0.7)(+6%) = −4.2%')+p('The negative sign says complements under the given data.')],
 ['Calculate the new directional elasticity',eq('E<sub>A,R</sub> = (−5%)/(+20%) = −0.25')+p('The magnitude is smaller in this observation. The two calculations reverse which good’s price changes, so their difference alone does not establish that one fixed elasticity changed over time.')],
 ['Explain essential versus nonessential demand',p('A nonessential purchase can be delayed, skipped, or replaced. An optional designer bag may therefore lose many buyers after a price rise. A necessary medicine with few substitutes is typically less responsive over the same horizon.') ]));
reg('E2-2(b)',[2025,2026,2027,2028,2029,2030],[25,32,47,53,70,85],[2040,2045],'thousand');
add('E2-3(a)','Increasing, constant, and decreasing returns depend on how output scales relative to all inputs.',returnsSteps);
add('E2-3(b)','Printed phone inputs give invalid negative demand. The revenue maximum is Q = 800, P = ₹4,000, Eₚ = −1.',steps(
 ['Substitute the printed income and price',eq('Q = 5000 − 3(5000) + 0.4(12000) = −5,200')+eq('Mechanical Eᵧ = (∂Q/∂Y)(Y/Q) = 0.4(12000/−5200) = −0.9231')+p('The formula point has negative quantity, so that elasticity has no economic interpretation. A 15% income increase is ₹1,800. The equation predicts ΔQ=0.4(1,800)=720 and Q′=−4,480, still outside the feasible demand domain.')],
 ['Find the revenue-maximizing point',eq('TR = PQ = 8000Q − 5Q² · MR = 8000 − 10Q')+eq('MR = 0 ⇒ Q = 800 · P = 8000 − 5(800) = ₹4,000')+p('The second derivative is −10, so this is a maximum. TR = ₹32,00,000.')],
 ['Find elasticity at that point',eq('Q = 1600 − 0.2P ⇒ Eₚ = (−0.2)(4000/800) = −1')+p('Demand is unit elastic at the interior total-revenue maximum.') ]));
{
 const a=depreciation('Straight line',400000,40000,12,'SL',0,'₹'), b=depreciation('Declining balance',600000,0,10,'DB',.15,'₹');
 add('E2-4(a)','Straight line ₹30,000/year. Declining balance closes year 10 at ₹'+num(b.bv)+'.',[...a.steps.map(x=>({...x,label:'Straight line · '+x.label})),...b.steps.map(x=>({...x,label:'Declining balance · '+x.label}))]);
}
add('E2-4(b)','As printed at Q=50, TC = ₹3,250, AC = ₹65, AVC = MC = ₹45.',steps(
 ['Read the exact printed cost function',eq('TC = 1000 + 40Q + 5Q = 1000 + 45Q')+p('Both variable terms are linear on the scan.')],
 ['Calculate at Q = 50',table(['Measure','Calculation','Value'],[['TC','1000 + 45(50)','₹3,250'],['AC','3250/50','₹65'],['AVC','[TC−TFC]/Q = 2250/50','₹45'],['MC','dTC/dQ = 45','₹45']])+eq('dAC/dQ = (MC − AC)/Q = (45−65)/50 = −0.4')+p('Since MC lies below AC, AC is falling.')],
 ['If the examiner intended a squared term',table(['Measure','For TC = 1000+40Q+5Q² at Q=50'],[['TC','₹15,500'],['AC','₹310'],['AVC','₹290'],['MC','40+10Q = ₹540']])+p('This interpretation gives rising AC because MC>AC.') ]));
bcPW('E2-5(a)',.07,25,[['Toll revenue',Array(10).fill(6)]],2,5,10,'₹ lakh','Annual O&M = ₹1.20 lakh operating + ₹0.80 lakh maintenance.');
add('E2-5(b)','Fixed cost keeps ATC above AVC. MC crosses each average cost curve at its minimum.',steps(
 ['Answer (i) and (v) using the fixed-cost gap',eq('ATC = (TFC+TVC)/Q = AFC + AVC · ATC − AVC = TFC/Q')+p('At positive fixed cost and any finite Q>0 the gap is positive. It gets smaller as Q rises, so the curves approach one another without intersecting.')],
 ['Answer (ii) and (iii) using marginal output',eq('With fixed wage w and labour the only variable input, MC = w/MPₗ')+p('If MP rises at first and then falls, MC falls at first and then rises. In a discrete output table the first MC refers to the move from zero to one unit. In a differentiable cost model, a right-hand derivative at zero can exist.')+costPlot],
 ['Answer (iv) using the slope of TC',eq('MC = dTC/dQ · d²TC/dQ² = dMC/dQ')+p('TC starts at TFC. It rises at a decreasing rate while MC falls, then rises at an increasing rate when MC rises. The inflection of the typical S-shaped TC curve aligns with minimum MC.') ]));
{
 const cash=ann(150000,45570,0,5),r=irrBetween(cash);
 add('E2-6(a)','IRR = '+fmtPct(r)+' · accept at 10% MARR.',irrParts(cash,r,'$',.10));
}
{
 const z=breakEven(800,500,150000,700),h=breakEven(800,500,200000,700);
 add('E2-6(b)','BEP = 500 units. Profit at 700 units = ₹60,000. New BEP = 667 whole units.',steps(
 ['Original break-even point',breakSetup(z)+eq('Profit at 700 = 700(800−500) − 1,50,000 = ₹60,000')],
 ['Recalculate for fixed cost ₹2,00,000',breakSetup(h)+p('The exact break-even point is 666⅔ units. With indivisible units 667 are needed to cover fixed cost.')],
 ['Report margin of safety under both fixed costs',table(['Fixed cost','Actual sales','MOS units (continuous BEP)','MOS sales','MOS percentage'],[z,h].map(k=>[num(k.fc),'₹5,60,000',num(k.mos,6),'₹'+num(k.mos*k.P),fmtPct(k.mos/k.q)]))+p('The original margin is 200 units. With higher fixed cost and the whole-unit BEP, the margin is 33 whole units. The table uses exact break-even sales for the monetary and percentage answers.') ]));
}
add('E2-7(a)','A higher policy funding rate can weaken credit demand and reduce demand-side price pressure.',steps(
 ['Define both textbook rates',table(['Feature','Repo rate','Bank rate'],[['Transaction','Short-term funds against eligible securities with a repurchase agreement','Central-bank lending or rediscounting rate in the textbook treatment'],['Mechanism','Collateral and agreed repurchase','Separate facility or reference rate'],['Effect of a rise','Raises the cost of eligible repo funding','Can raise funding costs or signal tighter credit conditions']])],
 ['Trace the inflation transmission',eq('Higher funding rate → tighter bank credit or higher loan rates → lower borrowing → lower consumption and investment → weaker AD')+p('Lower demand pressure can moderate price increases, with a lag. The magnitude depends on pass-through and spending sensitivity.')],
 ['Tie the instrument to the inflation source',p('Tighter monetary policy directly restrains demand. If inflation comes from a fuel shortage, it can limit follow-on price pressure while the original supply problem requires a supply response.') ]));
{
 const flows=[[40,30,60,90,20],[20,30,40,50,80],[15,35,45,50,95]];
 const cum=flows.map(f=>f.map((_,t)=>sum(f.slice(0,t+1))));
 const details=flows.map((f,j)=>{const at=cum[j].findIndex(x=>x>=200),old=cum[j][at-1],rem=200-old;return ['ABC'[j],at,old,rem,f[at],num(at+rem/f[at],5)];});
 add('E2-7(b)','Choose A · simple payback 3.77778 years.',steps(
 ['Build cumulative undiscounted receipts',table(['Year','A inflow','A cumulative','B inflow','B cumulative','C inflow','C cumulative'],flows[0].map((_,t)=>[t+1,...flows.flatMap((f,j)=>[f[t],cum[j][t]])]))+p('All amounts are in ₹ thousands. The amount to recover is 200 for each machine.')],
 ['Interpolate within the recovery year',eq('Payback = full years before recovery + unrecovered amount / next year’s receipt')+table(['Machine','Full years','Recovered','Remaining','Next inflow','Payback'],details)],
 ['Rank the machines',p('A: 3+70/90=3.77778 years. C: 4+55/95=4.57895. B: 4+60/80=4.75. Choose A because it recovers the outlay first. Simple payback ignores discounting and cash flows after recovery.') ]));
}

const lesson=(id,result,...parts)=>add(id,result,parts);
const s=step;
const arcSeries=(a,g,n,i,unit='₹')=>table(['Year','Deposit ('+unit+')','Years earning interest','Future value of deposit'],Array.from({length:n},(_,j)=>[j+1,num(a+j*g),n-j-1,num((a+j*g)*(1+i)**(n-j-1))]));
lesson('E3-2(a)','Eₚ = −1.5094, Eᵧ = +0.1509. The separate effects are −1,600 and −800 units.',
 s('Calculate the base quantity',eq('Q₀ = 25000 − 8(2000) + 0.8(2000) = 10,600')),
 s('Use point elasticities at the original prices',eq('Eₚ = (∂Q/∂P)(P/Q₀) = −8(2000/10600) = −1.5094')+eq('Eᵧ = (∂Q/∂Y)(Y/Q₀) = 0.8(2000/10600) = +0.1509')+p('Demand is price-elastic at that point. The positive income elasticity classifies wheat as a normal good in this model.')),
 s('Re-evaluate the linear function',table(['Shock','Input change','Quantity change','New Q if applied alone'],[['Income −50%','−1,000','0.8(−1,000)=−800','9,800'],['Price +10%','+200','−8(200)=−1,600','9,000']])+p('The paper names separate locations, so report each shock separately. If both apply to the same demand curve, the changes add and Q falls to 8,200, a 22.64% decrease.')));
{
 const z=breakEven(200,100,2000000,60000);
 lesson('E3-2(b)','BEP 20,000 units or ₹40 lakh. MOS 40,000 units or ₹80 lakh.',
 s('Find break-even quantity and sales',breakSetup(z)),
 s('Compute actual contribution and profit',eq('Actual revenue = 60,000 × 200 = ₹1,20,00,000')+eq('Contribution = 60,000 × 100 = ₹60,00,000 · Profit = ₹40,00,000')),
 s('Verify margin of safety three ways',safety(z)+mosPlot(z)));
}
{
 const i=.20,n=25,a=10000,amount=a*F(i,n);
 lesson('E3-3(a)','The age-60 maturity value is ₹'+num(amount)+'.',
 s('Count the deposits and their growth periods',projectTimeline([['1','10,000','Accrues for 24 years'],['2','10,000','Accrues for 23 years'],['25','10,000','No interest after the last deposit']],'₹')+p('The first deposit is one year from now. This is an ordinary end-of-year annuity.')),
 s('Sum the geometric series',eq('F = A[1 + 1.2 + … + 1.2²⁴] = A[(1.2²⁵ − 1)/0.20]')+eq('F = 10,000 × '+num(F(i,n),8)+' = ₹'+num(amount))+expandFactors([['F/A',i,n,F(i,n)]],[['Calculator entry','10000 * ('+factorEntry('F/A',i,n)+')']])),
 s('Check the total',p('Principal deposited is 25 × ₹10,000 = ₹2,50,000. The remainder, ₹'+num(amount-a*n)+', is compound growth.')));
}
reg('E3-3(b)',[1,2,3,4,5],[18,12,10,9,4],[3.5],'units');
{
 const i=.12,n=15,a=6,g=.5, annual=a+g*G(i,n),pb=annual*A(i,n),pc=40+1.5*A(i,n);
 lesson('E3-4(a)','B/C = '+num(pb/pc,5)+' · the bridge is justified on the stated cash flows.',
 s('Lay out base savings and the annual gradient',projectTimeline([['0','−40','Construction'],['1–15','−1.5 yearly','O&M'],['1','+6','Fuel savings base'],['2–15','6.5, 7.0, …, 13.0','Fuel savings rise by 0.5 per year']],'₹ lakh')),
 s('Annualize the savings gradient',eq('(A/G,12%,15) = 1/0.12 − 15/(1.12¹⁵−1) = '+num(G(i,n),7))+eq('Equivalent savings = 6 + 0.5('+num(G(i,n),7)+') = '+num(annual,7)+' lakh/year')),
 s('Discount benefits and costs to year 0',eq('(P/A,12%,15) = '+num(A(i,n),7))+table(['PW component','Calculation','₹ lakh'],[['Fuel savings',num(annual,7)+' × '+num(A(i,n),7),num(pb,6)],['Construction','Already at year 0','40'],['O&M','1.5 × '+num(A(i,n),7),num(1.5*A(i,n),6)],['Total cost','40 + PW of O&M',num(pc,6)]])),
 s('Apply the test',eq('B/C = '+num(pb,6)+' / '+num(pc,6)+' = '+num(pb/pc,6))+p('Accept because the present value of savings exceeds the present value of costs at 12%.')));
}
{
 const ca=ann(100000,35000,8000,5),cb=ann(150000,45000,12000,5),cx=cb.map((v,j)=>v-ca[j]);
 const a=irrBetween(ca), b=irrBetween(cb), x=irrBetween(cx);
 lesson('E3-4(b)','Incremental IRR = '+fmtPct(x)+'. Choose B only below that MARR, assuming the annual amounts are inflows.',
 s('Interpret the ambiguous row',p('The paper labels ₹45,000 and ₹60,000 “Annual Investment.” Treat them as annual gross inflows for the intended IRR calculation, since annual expenses are listed separately. If the amounts are literal additional outflows and there are no operating receipts, the printed cash flows do not justify either project at a nonnegative MARR.')+table(['Year','A','B','B − A'],ca.map((v,j)=>[j,num(v),num(cb[j]),num(cx[j])]))),
 s('Screen and compare the alternatives',eq('NPV<sub>A</sub> = −100000 + 35000(P/A,r,5) + 8000(P/F,r,5)')+eq('NPV<sub>B</sub> = −150000 + 45000(P/A,r,5) + 12000(P/F,r,5)')+table(['Cash flow','IRR'],[['A',fmtPct(a)],['B',fmtPct(b)],['B − A',fmtPct(x)]])),
 ...irrParts(cx,x,'₹').slice(1),
 s('State the decision as a function of MARR',table(['Required return','Decision'],[['Below '+fmtPct(x),'Choose B'],['At incremental IRR','Tie between A and B'],['Above incremental IRR and below '+fmtPct(a),'Choose A'],['At A’s IRR','A breaks even against doing nothing'],['Above '+fmtPct(a),'Reject both']])+p('The question gives no MARR, so an unconditional winner does not follow.')));
}
bcCompare('E3-5(a)',.10,[['A₁',30,9,5],['A₂',60,15,7]],'₹ lakh');
add('E3-5(b)','Stage II runs from maximum AP to maximum TP.',productionSteps);
lesson('E3-6(a)','Inflation means the general price level keeps rising. Classify it by speed and by whether prices are restrained.',
 s('Define inflation and show how to measure it',eq('Inflation rate = [(price index this period − last period) / last period] × 100')+p('If the index rises from 125 to 130, inflation is 4%. One commodity becoming more expensive by itself is a relative-price change.')),
 s('Classify by pace',table(['Type','Meaning','Illustration'],[['Creeping','Slow and persistent','A low annual price increase'],['Walking','Moderate, more noticeable','Household costs rise visibly each year'],['Galloping','Rapid and disruptive','Prices rise at high double-digit annual rates'],['Hyperinflation','Extreme sustained price acceleration','Prices re-quoted frequently as money loses purchasing power']])+p('Textbooks can use different numerical boundaries. The labels here describe relative pace.')),
 s('Classify by government response',table(['Type','Price behaviour','Example'],[['Open','Market prices show the pressure','Prices rise freely as goods become scarce'],['Suppressed or repressed','Controls restrain posted prices while excess demand remains','Price ceilings lead to rationing, queues or unofficial premiums']])));
{
 const i=.15,n=10,g=500,d=4000, future=(d+g*G(i,n))*F(i,n), alt=(800+g*G(i,n))*F(i,n);
 lesson('E3-6(b)','If ₹4,000 is the first deposit, the year-10 fund is ₹'+num(future)+'.',
 s('Separate uniform deposits and gradient',eq('Deposit in year t = 4000 + 500(t−1), t=1,…,10')+p('The final deposit is ₹8,500. Use end-of-year timing.')),
 s('Convert to a future amount',eq('(A/G,15%,10) = '+num(G(i,n),8)+' · (F/A,15%,10) = '+num(F(i,n),8))+eq('F = [4000 + 500('+num(G(i,n),8)+')] × '+num(F(i,n),8)+' = ₹'+num(future))+expandFactors([['A/G',i,n,G(i,n)],['F/A',i,n,F(i,n)]],[['Calculator entry','(4000 + 500 * ('+factorEntry('A/G',i,n)+')) * ('+factorEntry('F/A',i,n)+')']])),
 s('Check by compounding each deposit',arcSeries(d,g,n,i)+p('The phrase “20% of the salary, which is ₹4,000” is ambiguous. If ₹4,000 means salary, start with 20% × ₹4,000 = ₹800, keep the printed ₹500 deposit increase, and get ₹'+num(alt)+'.')));
}
const elasticityCurves=[
 ['Perfectly inelastic','0','Quantity stays fixed even when price changes.',[['M215 26V188']],[[222,47,'D']]],
 ['Relatively inelastic','0 < |Eₚ| < 1','At the marked point a 1% price change moves quantity less than 1%.',[['M115 30L285 173']],[[289,171,'D']]],
 ['Unit elastic','1','A constant-expenditure curve has P·Q constant.',[['M74 30 C88 112 152 151 356 173']],[[362,172,'D']]],
 ['Relatively elastic','1 < |Eₚ| < ∞','At the marked point a 1% price change moves quantity more than 1%.',[['M69 77L386 146']],[[391,147,'D']]],
 ['Perfectly elastic','∞','Demand is horizontal at the quoted price. Above that price the limiting model has zero demand.',[['M48 103H384']],[[390,105,'D']]]
];
lesson('E4-2(a)','The five classes range from zero price response to the perfectly elastic limit.',
 s('Define the measure',eq('|Eₚ| = |%ΔQ / %ΔP|')+p('Use magnitudes when classifying the five cases. A downward-sloping demand curve typically has a negative signed elasticity.')),
 s('Classify each response',table(['Class','Magnitude','Meaning'],elasticityCurves.map(([name,mag,why])=>[name,mag,why]))),
 s('Draw the curves', '<div class="ee-figure-grid">'+elasticityCurves.map(([name,mag,why,curves,labels])=>plot(name+' · '+why,'Quantity','Price',curves,labels)).join('')+'</div>'+p('The steep and flat straight lines illustrate responses locally when units and comparison points are held comparable. Elasticity on a linear curve changes along that curve.')));
lesson('E4-2(b)','Maximum TR = ₹16 crore at Q = 40,000 and P = ₹4,000. MR = 0.',
 s('Invert the demand function',eq('Q = 80000 − 10P ⇒ P = 8000 − 0.1Q')),
 s('Derive total and marginal revenue',eq('TR = PQ = 8000Q − 0.1Q²')+eq('MR = dTR/dQ = 8000 − 0.2Q')),
 s('Set MR to zero and check',eq('8000 − 0.2Q = 0 ⇒ Q = 40,000 · P = 8000 − 0.1(40000) = ₹4,000')+p('d²TR/dQ²=−0.2, so the stationary point is a maximum. TR=₹4,000×40,000=₹16,00,00,000.')));
lesson('E4-3(a)','TP peaks at Y=10, AP at Y=7.5, and MP at Y=5.',
 s('Derive AP and MP',eq('AP = Q/Y = 9Y − 0.6Y², Y>0')+eq('MP = dQ/dY = 18Y − 1.8Y²')),
 s('Set the relevant derivative to zero',table(['Quantity to maximize','Stationary condition','Input Y','Peak value'],[['TP','18Y−1.8Y²=0, take the positive root',10,300],['AP','9−1.2Y=0',7.5,33.75],['MP','18−3.6Y=0',5,45]])),
 s('Confirm the maxima',p('MP changes from positive to negative at Y=10. The second derivatives of AP and MP are −1.2 and −3.6. At maximum AP, AP=MP=33.75, which is a useful check.')));
add('E4-3(b)','The output-maximizing bundle is on the highest affordable isoquant.',isoSteps);
lesson('E4-4(a)','Minimum AVC at Q=25. Minimum MC at Q=50/3 ≈ 16.667.',
 s('Build each cost function',table(['Measure','Calculation','Expression'],[['AVC','TVC/Q','3000−25Q+0.5Q²'],['AC','(TVC+5000)/Q','3000−25Q+0.5Q²+5000/Q'],['MC','dTVC/dQ','3000−50Q+1.5Q²']])),
 s('Differentiate AVC and MC',eq('dAVC/dQ = −25 + Q = 0 ⇒ Q=25')+eq('dMC/dQ = −50 + 3Q = 0 ⇒ Q=50/3')+p('The second derivatives are 1 and 3, so both stationary values are minima.')),
 s('Check the values at the minima',table(['Quantity','Cost check'],[['Q=25','AVC=MC=2687.50'],['Q=50/3','MC=2583.33']])+p('AVC and MC are minimized at different outputs. The crossing marks the AVC minimum.')));
{
 const z=breakEven(50,30,80000,9000);
 lesson('E4-4(b)','BEP 4,000 units, P/V 40%, and MOS ₹2,50,000 at the target profit.',
 s('Compute contribution and break-even sales',breakSetup(z)),
 s('Convert target profit into required volume',eq('Q = (fixed cost + target profit) / contribution per unit')+eq('Q = (80,000 + 1,00,000)/20 = 9,000 units · sales = ₹4,50,000')),
 s('Reconcile margin of safety',safety(z)+mosPlot(z)));
}
pw('E4-5(a)',.12,25,[['A',20,2,.3],['B',25,2.5,.4]],'₹ lakh');
bcCompare('E4-5(b)',.15,[['Project 1',40,2,6],['Project 2',70,5,6]],'₹ lakh');
lesson('E4-6(a)','Service life is missing. The paper supports a general formula, plus a conditional example.',
 s('Flag the printed data',p('The scan prints the purchase price as “₹2,00,00” and gives no life. Interpret the malformed first cost as ₹2,00,000 for the formula below. Salvage is ₹40,000 and annual interest is 10%.')),
 s('Write the schedule for any life n',eq('Fixed deposit A = (2,00,000−40,000)(0.10)/(1.10ⁿ−1) = 16,000/(1.10ⁿ−1)')+eq('Dₜ = A(1.10)ᵗ⁻¹ · BVₜ = 2,00,000 − A[(1.10ᵗ−1)/0.10]')+table(['Year','Year depreciation','Closing book value'],[[1,'A','2,00,000−A'],[2,'1.10A','2,00,000−2.10A'],['t','A(1.10)ᵗ⁻¹','2,00,000−A(F/A,10%,t)'],['n','A(1.10)ⁿ⁻¹','40,000']])),
 s('See a numerical example with n = 5',p('Five years is illustrative and is not stated in the paper.')+depreciation('Sinking fund',200000,40000,5,'SF',.10,'₹').steps[1].html));
add('E4-6(b)','Reduce demand pressure through government spending, transfers, and taxes.',fiscalSteps);

lesson('E5-2(a)','Initial-base elasticity −0.25. Midpoint elasticity −0.2821. Petrol is inelastic either way.',
 s('Calculate price and quantity changes',table(['Variable','Initial','New','Initial-base percentage change'],[['Price per litre','₹100','₹120','(120−100)/100 = +20%'],['Daily litres','20 lakh','19 lakh','(19−20)/20 = −5%']])+eq('Eₚ = −5% / 20% = −0.25')),
 s('Show the midpoint convention',eq('E<sub>arc</sub> = [−1 / 19.5] / [20 / 110] = −0.2821')+p('The absolute value is below 1 in both calculations. The midpoint measure is symmetric between the two observations.')),
 s('Explain and suggest',p('Many commuters have to travel even when petrol gets more expensive, and viable substitutes may be limited in the short run. More frequent public transit and practical alternatives give commuters a way to switch, making demand more responsive.')));
lesson('E5-2(b)','Estimated own-price elasticity −1.2. A small price cut raises total revenue, other things equal.',
 s('Separate the two non-price effects',table(['Driver','Change','Elasticity','Predicted sales effect'],[['Per-capita income','+4%','+2.0','+8%'],['Competitor’s price','+15%','+0.40','+6%'],['Own price','−5%','Unknown','20%−8%−6%=+6%']])),
 s('Recover the own elasticity',eq('Eₚ = (+6%)/(−5%) = −1.2')+p('This uses a first-order additive decomposition. Positive cross elasticity is consistent with substitute phones.')),
 s('Translate elasticity into revenue advice',eq('%ΔTR ≈ %ΔP + %ΔQ = (1+Eₚ)%ΔP')+p('With Eₚ=−1.2, a small own-price cut increases revenue at fixed income and competitor price. Using the 5% price decrease and estimated 6% quantity increase as finite changes, 0.95×1.06=1.007, about +0.7% revenue. This is revenue rather than profit.')));
function tax(id,d0,dSlope,s0,sSlope,{rate=0,unit=0}={}){
 const p0=(d0-s0)/(dSlope+sSlope),q0=d0-dSlope*p0;
 const ps=(d0-s0-dSlope*unit)/(dSlope*(1+rate)+sSlope),pc=ps*(1+rate)+unit,q1=s0+sSlope*ps;
 const shift=rate?'Pᶜ = 1.30Pˢ':'Pᶜ = Pˢ + '+unit;
 const wedge=pc-ps,buyer=pc-p0,seller=p0-ps;
 const graph=taxPlot(q0,q1,p0,pc,ps,rate);
 lesson(id,'After tax buyers pay ₹'+num(pc)+', sellers receive ₹'+num(ps)+', quantity '+num(q1)+'.',
 s('Solve the pre-tax equilibrium',eq(d0+' − '+dSlope+'P = '+s0+' + '+sSlope+'P ⇒ P₀ = ₹'+num(p0)+' · Q₀ = '+num(q0))),
 s('Set the tax wedge and solve',eq(shift)+eq(d0+' − '+dSlope+'('+ (rate?'1.30Pˢ':'Pˢ + '+unit)+') = '+s0+' + '+sSlope+'Pˢ')+eq('Pˢ = ('+d0+' − '+s0+' − '+dSlope+'×'+unit+') / ['+dSlope+'×'+(1+rate)+' + '+sSlope+'] = ₹'+num(ps,6))+table(['Measure','Before','After'],[['Buyer price','₹'+num(p0),'₹'+num(pc,5)],['Seller receipt','₹'+num(p0),'₹'+num(ps,5)],['Quantity',num(q0),num(q1,5)]])),
 s('Allocate the per-unit burden',table(['Side','Calculation','Burden per unit','Share'],[['Buyer','Pᶜ − P₀','₹'+num(buyer,5),fmtPct(buyer/wedge)],['Seller','P₀ − Pˢ','₹'+num(seller,5),fmtPct(seller/wedge)],['Total wedge','Pᶜ − Pˢ','₹'+num(wedge,5),'100%']])+graph+p(Math.abs(buyer-seller)<1e-8?'The economic burden splits equally.':'Sellers bear the larger share because their net receipt falls by more than the buyer price rises.')));
}
tax('E5-3(a)',1200,8,200,2,{rate:.30});
{
 const f=2000000,i=.075,n=8,pv=f*disc(i,n),a=f/F(i,n);
 lesson('E5-3(b)','Deposit ₹'+num(pv)+' now or ₹'+num(a)+' at each year-end.',
 s('Discount the target to year 0',eq('P = F/(1+i)ⁿ = 20,00,000/(1.075)⁸ = ₹'+num(pv))),
 s('Find the equal end-of-year deposit',eq('(F/A,7.5%,8) = [(1.075)⁸−1]/0.075 = '+num(F(i,n),8))+eq('A = 20,00,000/'+num(F(i,n),8)+' = ₹'+num(a))+expandFactors([['F/A',i,n,F(i,n)]],[['Calculator entry','2000000 / ('+factorEntry('F/A',i,n)+')']])),
 s('Verify the accumulation',arcSeries(a,0,n,i)+eq('A(F/A,7.5%,8) = ₹20,00,000 using the unrounded annual deposit.')));
}
{
 const i=.12,f=A(i,10),d10=disc(i,10),d20=disc(i,20),total=-100+10*f+12*f*d10+20*d20;
 lesson('E5-4(a)','NPV = '+num(total,5)+' crore at 12% · reject on these cash flows.',
 s('Split the timeline into two annuities',projectTimeline([['0','−100','Build the unit'],['1–10','+10 per year','Discount the ordinary annuity directly to year 0'],['11–20','+12 per year','Annuity factor gives its value at year 10'],['20','+20','Salvage, separate from the year-20 inflow']],'₹ crore')),
 s('Calculate each present worth',table(['Component','Substitution','PW (₹ crore)'],[['First block','10 × '+num(f,8),num(10*f,6)],['Second block','12 × '+num(f,8)+' × '+num(d10,8),num(12*f*d10,6)],['Salvage','20 × '+num(d20,8),num(20*d20,6)],['Cost','−100','−100']])+p('Discount the second annuity ten more years after valuing it at year 10.')),
 s('Apply the NPV rule',eq('NPV = −100 + '+num(10*f,6)+' + '+num(12*f*d10,6)+' + '+num(20*d20,6)+' = '+num(total,6)+' crore')+p('The net present worth is below zero at the stated MARR.')));
}
{
 const cash=[-1000000,320000,320000,320000,320000,100000],r=irrBetween(cash);
 add('E5-4(b)','IRR = '+fmtPct(r)+' · buy the machine at an 11% MARR.',irrParts(cash,r,'₹',.11));
}
lesson('E5-5(a)','The first case shows increasing returns. The second gives constant returns.',
 s('Calculate the input and output factors',eq('Input scaling t=1.5 · output factor = 450/200 = 2.25')+p('If returns were constant, 1.5 times both inputs would give 300 units. The observed 450 exceeds 300.')),
 s('Use the functional test',eq('If f(tL,tK) = t·f(L,K), output increases exactly in proportion to all inputs.')+p('That is constant returns to scale for the whole function.')),
 s('Present the two cases visually',returnsPlot+table(['Case','Proportional benchmark','Observed','Classification'],[['1','300 units at t=1.5','450 units','Increasing'],['2','tQ','tQ','Constant']])));
lesson('E5-5(b)','AC = MC = 30 at Q=10, the minimum AC. AVC = w/APₗ.',
 s('Derive both costs and solve the equality',eq('AC = 100/Q + 10 + Q · MC = 10 + 2Q')+eq('100/Q + 10 + Q = 10 + 2Q ⇒ Q² = 100 ⇒ Q = 10')+p('At Q=10, both are 30. dAC/dQ = 1−100/Q², which changes from negative to positive there.')),
 s('Connect AVC to average product',eq('TVC = wL · APₗ = Q/L')+eq('AVC = TVC/Q = wL/Q = w/(Q/L) = w/APₗ')+p('Assume labour is the only variable input and the wage per unit is constant. Positive AP and AVC move in opposite directions.')),
 s('Draw the linked shapes',plot('Average product rises, reaches a maximum, then falls.','Output Q','Average product',[['M54 172Q174 24 389 149'],['M210 67V188','ee-dashed']],[[213,63,'AP maximum']])+plot('AVC falls while AP rises and reaches its minimum at the same output.','Output Q','Average variable cost',[['M54 40Q163 206 389 57'],['M210 120V188','ee-dashed']],[[216,129,'AVC minimum']])+p('Under the stated assumptions maximum AP corresponds to minimum AVC.')));
{
 const z=depreciation('200% declining balance',110000,8000,5,'DB',2/5,'$');
 add('E5-6(a)','Standard 40% schedule ends at $'+num(z.bv)+'.',[s('Find the double-declining rate',eq('Straight-line rate = 1/5 = 20% · double rate = 40%')+eq('Year 1 depreciation = 0.40×110,000 = $44,000 · closing BV = $66,000')),...z.steps,s('If exact salvage is required',eq('Opening BV in year 5 = $14,256 · exact-salvage charge = 14,256−8,000 = $6,256')+p('That terminal adjustment replaces the normal year-5 charge of $5,702.40. Standard double-declining with only a salvage floor ends at $8,553.60.'))]);
}
{
 const i=.10,n=20,f=A(i,n),cp=20/f,ct=3*disc(i,10)/f,bs=1/F(i,n),b=2+bs,c=cp+.5+ct;
 lesson('E5-6(b)','Annual-worth B/C = '+num(b/c,6)+' · reject on the stated cash flows.',
 s('Put the bridge cash flows on a timeline',projectTimeline([['0','−20','Initial construction'],['1–20','−0.5 + 2 every year','Maintenance and public benefits'],['10','−3','One-time inspection'],['20','+1','Scrap at end of first period']],'₹ crore')),
 s('Convert each one-time flow into an equivalent annuity',eq('(A/P,10%,20) = '+num(1/f,8)+' · (A/F,10%,20) = '+num(bs,8))+table(['Component','Annual-worth calculation','₹ crore/year'],[['Construction','20 × (A/P,10%,20)',num(cp,6)],['Maintenance','Already annual','0.5'],['Test','3 × (P/F,10%,10) × (A/P,10%,20)',num(ct,6)],['Public benefits','Already annual','2'],['Scrap','1 × (A/F,10%,20)',num(bs,6)]])),
 s('Compare annual benefits with annual costs',eq('AW(B) = '+num(b,6)+' · AW(C) = '+num(c,6)+' crore/year')+eq('B/C = '+num(b,6)+' / '+num(c,6)+' = '+num(b/c,6))+p('The ratio is below one. Annualizing both sides consistently would give the same ratio as present-worth analysis.')));
}
{
 const z=breakEven(50,40,200000,25000),h=breakEven(60,40,200000,25000);
 lesson('E5-7(a)','BEP falls from 20,000 to 10,000 units after the price rise.',
 s('Calculate the original break-even point',breakSetup(z)),
 s('Apply the 20% price rise',eq('New price = 50×1.20 = ₹60')+breakSetup(h)+table(['At 25,000 units','₹50 price','₹60 price'],[['Profit','₹50,000','₹3,00,000'],['BEP sales','₹10,00,000','₹6,00,000'],['MOS units','5,000','15,000'],['MOS sales','₹2,50,000','₹9,00,000'],['MOS %','20%','60%']])),
 s('Show the margin of safety',mosPlot(z)+mosPlot(h)+p('The two diagrams use the same sales volume and different prices, so the margin can be read for either interpretation of the final subpart.')));
}
add('E5-7(b)','Demand-pull raises output in the short-run model. Cost-push lowers it.',inflationSteps);
tax('E6-2(a)',10000,2,7000,2,{unit:100});
lesson('E6-2(b)','TP becomes concave after L=33⅓. Stage II begins after L=50.',
 s('Derive the marginal product',eq('TP = 100L + 500L² − 5L³')+eq('MP = 100 + 1000L − 15L²')),
 s('Find the inflection point of TP',eq('dMP/dL = 1000 − 30L = 0 ⇒ L = 100/3 ≈ 33.333')+p('Beyond this point MP declines. TP rises at a decreasing rate while MP remains positive.')),
 s('Find the start of Stage II',eq('AP = 100 + 500L − 5L² · dAP/dL = 500 − 10L = 0 ⇒ L = 50')+eq('AP(50) = MP(50) = 12,600')+p('Stage II starts at the maximum of AP. Diminishing marginal returns start earlier, at the maximum of MP.')));
lesson('E6-3(a)','MC crosses AVC at Q=15 and starts rising after Q=10.',
 s('Calculate marginal and average variable cost',eq('AVC = 300 − 30Q + Q² · MC = 300 − 60Q + 3Q²')),
 s('Solve the crossing condition',eq('MC−AVC = −30Q + 2Q² = 2Q(Q−15)')+p('Q=0 is outside the domain of AVC. At Q=15, AVC=MC=75, and dAVC/dQ=−30+2Q=0 with positive second derivative.')),
 s('Locate the turning point of MC',eq('dMC/dQ = −60 + 6Q = 0 ⇒ Q = 10')+p('The slope is positive beyond 10. MC(10)=0 for the particular printed function. The MC minimum and the AVC crossing occur at different quantities.')));
{
 const i=.04,n=12,a=20000,g=1000,ann=a+g*G(i,n),f=ann*F(i,n);
 lesson('E6-3(b)','Elisha should deposit ₹'+num(ann)+' each year for 12 years.',
 s('Count Sophia’s 12 deposits',eq('Aₜ = 20,000 + 1,000(t−1), t=1,…,12')+p('The amounts run from ₹20,000 to ₹31,000. The gradient contributes zero in year 1.')),
 s('Convert the gradient to an annuity',eq('(A/G,4%,12) = 1/0.04 − 12/[(1.04)¹²−1] = '+num(G(i,n),8))+eq('A<sub>equiv</sub> = 20,000 + 1,000×'+num(G(i,n),8)+' = ₹'+num(ann))+expandFactors([['A/G',i,n,G(i,n)]],[['Calculator entry','20000 + 1000 * ('+factorEntry('A/G',i,n)+')']])),
 s('Check the common future value',arcSeries(a,g,n,i)+eq('A<sub>equiv</sub>(F/A,4%,12) = ₹'+num(f)+'.')));
}
{
 const i=.08,n=20,f=A(i,n),parts=[['A',450000,5000,90000,80000],['B',300000,10000,100000,90000]];
 const rows=parts.map(([name,P,O,M,S])=>[name,P/f,O,M*disc(i,10)/f,-S/F(i,n),(P+M*disc(i,10)-S*disc(i,n))/f+O]);
 lesson('E6-4(a)','Choose plan B. Its equivalent annual cost is $'+num(rows[1].at(-1))+'.',
 s('Set the timing and sign',projectTimeline([['0','A −450,000 / B −300,000','Initial cost'],['1–20','A −5,000 / B −10,000 each year','O&M'],['10','A −90,000 / B −100,000','Special maintenance'],['20','A +80,000 / B +90,000','Salvage offsets costs']],'$')),
 s('Annualize each component',eq('EUAC = P(A/P) + O + M(P/F,8%,10)(A/P) − S(A/F)')+eq('(A/P,8%,20) = '+num(1/f,8)+' · (A/F,8%,20) = '+num(1/F(i,n),8)+' · (P/F,8%,10) = '+num(disc(i,10),8))),
 s('Compare annual costs',table(['Plan','Initial AW','O&M','Year-10 cost AW','Salvage offset','Total annual cost ($)'],rows.map(r=>[r[0],...r.slice(1).map(x=>num(x))]))+p('Both plans provide the same assumed service. Plan B saves $'+num(rows[0].at(-1)-rows[1].at(-1))+' per year.')));
}
{
 const z=depreciation('Sinking fund',400000,100000,6,'SF',.12,'$');
 add('E6-4(b)','Fixed fund deposit $'+num(z.uniform)+' yearly. Year-6 book value $100,000.',[s('Convert the salvage percentage',eq('S = 25%×400,000 = $100,000 · required accumulated fund = $300,000')),...z.steps]);
}
reg('E6-5(a)',[2015,2016,2017,2018,2019,2020],[25,32,47,53,70,85],[2021,2024],'thousand');
lesson('E6-5(b)','K given up per extra L = 1/5, 1/4, 1/3. Reciprocal ratios = 5, 4, 3.',
 s('Write the finite differences',table(['Move','L before → after','K before → after','ΔL','ΔK'],[['A → B','10 → 15','20 → 19',5,-1],['B → C','15 → 19','19 → 18',4,-1],['C → D','19 → 22','18 → 17',3,-1]])),
 s('Calculate both MRTS conventions',table(['Move','−ΔK/ΔL, K per L','−ΔL/ΔK, L per K'],[['A → B','1/5','5'],['B → C','1/4','4'],['C → D','1/3','3']])+p('Each entry is a positive trade-off magnitude. With L horizontal and K vertical, the actual segment slopes are −1/5, −1/4, and −1/3.')),
 s('Interpret the table as printed',p('K relinquished per extra unit of labour increases along these observations. Preserve that result even though a textbook strictly convex isoquant is commonly drawn with diminishing MRTS.')));
add('E6-6(a)','Demand-pull shifts AD right. Cost-push shifts SRAS left.',inflationSteps);
add('E6-6(b)','AP rises if MP exceeds it, peaks at MP=AP, and falls if MP is below it.',productionSteps);
export function upgradeQuestions(questions){
 const long=questions.filter(q=>q.marks>=4);
 if(long.length!==solutions.size||long.some(q=>!solutions.has(q.id)))throw Error('EE worked-answer coverage is incomplete.');
 return questions.map(q=>{
  const replacement=solutions.get(q.id);
  if(!replacement){
   if(q.id!=='E5-1(h)')return q;
   const i=.12,full=16,elapsed=13,cost=1000000,base=800000;
   const entry=cost+' - ('+base+' / ('+factorEntry('F/A',i,full)+')) * ('+factorEntry('F/A',i,elapsed)+')';
   const remaining=cost-base/F(i,full)*F(i,elapsed);
   return {...q,ahtml:q.ahtml+expandFactors([['F/A',i,full,F(i,full)],['F/A',i,elapsed,F(i,elapsed)]],[['Book value calculator entry',entry],['Year 13 book value',num(remaining)+' dollars']])};
  }
  return {...q,...replacement,question:replacement.question??q.question,solution:replacement.ahtml.replace(/<[^>]*>/g,' ')};
 });
}
export {solutions};
