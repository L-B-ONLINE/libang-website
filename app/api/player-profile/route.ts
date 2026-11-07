import {getDb} from '../../../db';
import {minecraftProfiles} from '../../../db/schema';
export async function GET(){
 const rows=await getDb().select({userId:minecraftProfiles.userId,uuid:minecraftProfiles.uuid,name:minecraftProfiles.name,skinUrl:minecraftProfiles.skinUrl}).from(minecraftProfiles);
 const profiles=Object.fromEntries(rows.map(({userId,...profile})=>[userId,profile]));
 return Response.json({profiles},{headers:{'cache-control':'no-store'}});
}
export async function PUT(){return Response.json({error:'Microsoft 계정을 연결해주세요.'},{status:405});}
