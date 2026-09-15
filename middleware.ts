import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {randomUUID} from "crypto";

export function middleware(req:NextRequest){
 const url=req.nextUrl;
 let response:NextResponse;
 if(url.pathname==="/"&&url.searchParams.has("shop")&&url.searchParams.has("hmac")&&url.searchParams.has("timestamp")){
  const target=new URL("/api/connectors/shopify/install",url.origin);url.searchParams.forEach((value,key)=>target.searchParams.set(key,value));response=NextResponse.redirect(target);
 }else response=NextResponse.next();
 if(!req.cookies.get("tentran_workspace"))response.cookies.set("tentran_workspace",randomUUID(),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*365});
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
