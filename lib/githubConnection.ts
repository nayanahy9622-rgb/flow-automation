import {getConnector,setConnector,removeConnector,ConnectorAuth} from "./connectorStore";

export type GitHubUser={id:number;login:string;name?:string|null;avatarUrl?:string|null};
export type GitHubAuth=ConnectorAuth&{githubUser:GitHubUser;refreshTokenExpiresAt?:number};

const key=(userId:string)=>`github:${userId}`;
export const getGitHubAuth=(userId:string)=>getConnector(key(userId)) as GitHubAuth|undefined;
export const setGitHubAuth=(userId:string,auth:GitHubAuth)=>setConnector(key(userId),auth);
export const removeGitHubAuth=(userId:string)=>removeConnector(key(userId));
