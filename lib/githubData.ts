import {getGitHubAuth,setGitHubAuth} from "./githubConnection";

async function api(path:string,token:string,init:RequestInit={}){const r=await fetch(`https://api.github.com${path}`,{cache:"no-store",...init,headers:{accept:"application/vnd.github+json",authorization:`Bearer ${token}`,"X-GitHub-Api-Version":"2026-03-10",...(init.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||`GitHub API failed (${r.status})`);return j;}

export async function githubData(userId:string){
 const auth=getGitHubAuth(userId);if(!auth)throw new Error("github_not_connected");
 const [user,repos,issues,prs]=await Promise.all([api("/user",auth.accessToken),api("/user/repos?per_page=20&sort=updated",auth.accessToken),api("/user/issues?per_page=20&state=open",auth.accessToken),api("/search/issues?q=author%3Ame+is%3Apr&per_page=20",auth.accessToken)]);
 return {user,repositories:repos,openIssues:issues,openPullRequests:prs.items||[]};
}
