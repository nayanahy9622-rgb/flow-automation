import "./globals.css";
import type {Metadata} from "next";

export const metadata:Metadata={
  title:"TenTran AI - Commerce Operating System",
  description:"AI operating system for commerce operations and automation"
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
