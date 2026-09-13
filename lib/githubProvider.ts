import {ConnectorAuth} from "./connectorStore";

export const githubProvider={
  id:"github",
  name:"GitHub",
  mode:"oauth" as const,
  clientId:process.env.GITHUB_CLIENT_ID,
  clientSecret:process.env.GITHUB_CLIENT_SECRET,
  authorize:(clientId:string,redirectUri:string,state:string)=>{
    const u=new URL("https://github.com/login/oauth/authorize");
    u.searchParams.set("client_id",clientId);u.searchParams.set("redirect_uri",redirectUri);u.searchParams.set("state",state);u.searchParams.set("allow_signup","true");u.searchParams.set("prompt","select_account");
    return u.toString();
  },
  exchange:async(clientId:string,clientSecret:string,code:string,redirectUri:string):Promise<ConnectorAuth>=>{
    const r=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{accept:"application/json","content-type":"application/json"},body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri})});
    const j=await r.json();if(!r.ok||!j.access_token)throw new Error("GitHub token exchange failed");
    return {accessToken:j.access_token,refreshToken:j.refresh_token,expiresAt:j.expires_in?Date.now()+Number(j.expires_in)*1000:undefined,tokenType:j.token_type,scope:j.scope,connectedAt:Date.now(),meta:null,providerData:{}};
  }
};
