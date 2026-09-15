import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{return [{url:"https://tentranai.vercel.app",lastModified:new Date(),changeFrequency:"weekly",priority:1},{url:"https://tentranai.vercel.app/auth",lastModified:new Date(),changeFrequency:"monthly",priority:.7}];}
