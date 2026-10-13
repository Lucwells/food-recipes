const H={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36','accept-language':'en-US,en;q=0.9','cookie':'CONSENT=YES+1'};
const ctx={client:{clientName:'WEB',clientVersion:'2.20240201.01.00',hl:'en'}};
const post=async(b)=>(await fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false',{method:'POST',headers:{...H,'content-type':'application/json'},body:JSON.stringify({context:ctx,...b})})).json();
const find=(o,k,out=[])=>{if(o&&typeof o==='object'){for(const [a,v] of Object.entries(o)){if(a===k)out.push(v);find(v,k,out);}}return out;};
(async()=>{
const h=await (await fetch('https://www.youtube.com/watch?v='+process.argv[2],{headers:H})).text();
const m=h.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/s);
const d=JSON.parse(m[1]);
let tok=find(d,'continuationCommand').map(c=>c.token);
console.log('tokens',tok.length);
for(const t of tok){
 const j=await post({continuation:t});
 const txt=find(j,'commentEntityPayload');
 const old=find(j,'commentRenderer');
 console.log('resp: payloads',txt.length,'old',old.length);
 for(const c of txt.slice(0,5)) console.log('---',c.properties?.content?.content?.slice(0,2500));
 for(const c of old.slice(0,5)) console.log('---',(c.contentText?.runs||[]).map(r=>r.text).join('').slice(0,2500));
 if(txt.length||old.length)break;
 const nt=find(j,'continuationCommand').map(c=>c.token); tok.push(...nt.slice(0,3));
 if(tok.length>12)break;
}
})();
