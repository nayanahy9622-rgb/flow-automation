import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

export function middleware(req:NextRequest){
 const url=req.nextUrl;
 if(url.pathname!=="/")return NextResponse.next();
 if(url.searchParams.has("shop")&&url.searchParams.has("hmac")&&url.searchParams.has("timestamp")){
  const target=new URL("/api/connectors/shopify/install",url.origin);
  url.searchParams.forEach((value,key)=>target.searchParams.set(key,value));
  return NextResponse.redirect(target);
 }
 return NextResponse.next();
}

export const config={matcher:["/"]};
