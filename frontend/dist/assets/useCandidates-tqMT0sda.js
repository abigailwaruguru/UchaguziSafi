import{c as d}from"./index-P8k7hO93.js";import{u as o}from"./query-DxorjYkq.js";import{c as p}from"./api-JEjBv5hd.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=d("Briefcase",[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]]);function m(a={}){const{county:t="",election_type:s="",party_id:n="",search:r="",status:c="",page:u=1,per_page:y=12}=a,e={};return t&&(e.county=t),s&&(e.election_type=s),n&&(e.party_id=n),r&&r.length>=2&&(e.search=r),c&&(e.status=c),e.page=u,e.per_page=y,o({queryKey:["candidates",e],queryFn:async()=>(await p.getAll(e)).data,placeholderData:i=>i,staleTime:120*1e3})}function _(a){return o({queryKey:["candidate",a],queryFn:async()=>(await p.getById(a)).data,enabled:!!a})}export{g as B,_ as a,m as u};
//# sourceMappingURL=useCandidates-tqMT0sda.js.map
