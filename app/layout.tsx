import "./globals.css";
import type {Metadata} from "next";

export const metadata:Metadata={
  metadataBase:new URL("https://tentranai.vercel.app"),
  title:"TenTran AI - Commerce Operating System",
  description:"AI operating system for commerce operations and automation",
  applicationName:"TenTran AI",
  keywords:["TenTran AI","ecommerce automation","commerce operating system","Shopify automation","Razorpay automation"],
  alternates:{canonical:"/"},
  openGraph:{title:"TenTran AI - Commerce Operating System",description:"AI operating system for commerce operations and automation",url:"https://tentranai.vercel.app",siteName:"TenTran AI",type:"website"},
  robots:{index:true,follow:true},
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<a href="/auth" style={{position:"fixed",right:18,bottom:18,zIndex:1000,background:"#f5f7fa",color:"#0b0d10",padding:"10px 14px",borderRadius:10,fontWeight:700,fontSize:13,textDecoration:"none",boxShadow:"0 8px 30px rgba(0,0,0,.25)"}}>Sign in / Sign up</a></body></html>;
}
