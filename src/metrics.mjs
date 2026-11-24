export const metrics=Object.freeze(['exact','contains','normalized-exact','json-equal']);
const normalize=s=>s.normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase();
function equivalent(a,b,depth=0){
 if(depth>100)return false;
 if(a===b)return true;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const ak=Object.keys(a),bk=Object.keys(b);
 return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equivalent(a[k],b[k],depth+1));
}
export function score(metric,expected,actual){
 switch(metric){
 case 'exact':return actual===expected;
 case 'contains':return actual.includes(expected);
 case 'normalized-exact':return normalize(actual)===normalize(expected);
 case 'json-equal':try{return equivalent(JSON.parse(expected),JSON.parse(actual));}catch{return false;}
 default:throw new Error('Unsupported metric');
 }
}
