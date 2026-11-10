const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function calculationCell(value,calculation){
 if(!calculation)return escape(value);
 return '<button type="button" class="atlas-calc-cell" aria-label="'+escape(calculation.title+' = '+value)+'" aria-expanded="false" data-cell-calculation="'+escape(JSON.stringify(calculation))+'">'+escape(value)+'</button>';
}

export function calculationDetails(lines){
 return '<details class="atlas-calc-details"><summary>Expand this calculation</summary><dl>'+lines.map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd><code>'+escape(value)+'</code></dd></div>').join('')+'</dl></details>';
}
