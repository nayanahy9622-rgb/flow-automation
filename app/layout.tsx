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
  return <html lang="en"><body>{children}</body></html>;
}
