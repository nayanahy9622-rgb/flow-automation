import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/authStore";
export async function GET(){const user=await getCurrentUser();return NextResponse.json({ok:true,user:user?{id:user.id,name:user.name,email:user.email}:null},{headers:{"cache-control":"no-store"}});}
