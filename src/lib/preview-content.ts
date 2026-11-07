import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { additionalServices } from "@/data/service-offerings";
export const previewMode = process.env.NODE_ENV === "development";
type Row = Record<string, unknown> & { id: string };
type State = Record<string, Row[]>;
const file = path.join(process.cwd(),"work","preview-content.json");
let chain: Promise<void> = Promise.resolve();
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/," ").trim();
function defaults():State { return {services:additionalServices.map(s=>({...s,id:"offering-"+slug(s.title),visible:true,iconImage:"/images/services/"+s.image+".jpg",icon:"",bestForEn:"",bestForFr:"",timelineEn:"",timelineFr:"",currency:"USD",startingPrice:"",ctaLink:"",ctaLabelEn:"Explore service",ctaLabelFr:"Découvrir",faq:[],popular:false,deliveryDays:0,revisions:0})),skills:[
 ] as Row[]}; }
export async function previewState():Promise<State>{ try{return JSON.parse(await readFile(file,"utf8")) as State;}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;return defaults();} }
export async function previewRows<T>(table:string,rows:T[]):Promise<T[]>{if(!previewMode)return rows;const state=await previewState();const merged=new Map(rows.map(r=>[String((r as Row).id),r]));for(const r of state[table]??[]){if(r.__deleted)merged.delete(r.id);else merged.set(r.id,{...merged.get(r.id),...r} as T);}return [...merged.values()];}
export function previewWrite(table:string,row:Row):Promise<void>{const job=chain.then(async()=>{const state=await previewState();const list=state[table]??[];const i=list.findIndex(r=>r.id===row.id);if(i<0)list.push(row);else list[i]={...list[i],...row};state[table]=list;await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(state,null,2));});chain=job.catch(()=>undefined);return job;}
