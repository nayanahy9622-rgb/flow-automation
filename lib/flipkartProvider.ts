import {ConnectorAuth} from "./connectorStore";

async function jsonFetch(url:string,init:RequestInit={}){
 const res=await fetch(url,{cache:"no-store",...init});
 const json=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(`${res.status}: ${JSON.stringify(json)}`);
 return json;
}

export async function flipkartData(auth:ConnectorAuth){
 const [appId,appSecret]=auth.accessToken.split("|");
 if(!appId||!appSecret)throw new Error("Flipkart App ID and App Secret are required");
 const basic=Buffer.from(`${appId}:${appSecret}`).toString("base64");
 const token=await jsonFetch("https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api,Default",{headers:{authorization:`Basic ${basic}`,accept:"application/json"}});
 if(!token.access_token)throw new Error("Flipkart did not return an access token");
 const orders=await jsonFetch("https://api.flipkart.net/sellerservice/v3.0.0/orders/search",{method:"POST",headers:{authorization:`Bearer ${token.access_token}`,"content-type":"application/json",accept:"application/json"},body:JSON.stringify({pagination:{pageSize:20}})});
 return {orders,tokenExpiresIn:token.expires_in||null};
}

export async function validateFlipkart(auth:ConnectorAuth){await flipkartData(auth);}
