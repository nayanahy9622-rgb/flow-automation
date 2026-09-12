import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"FlowOS — E-commerce Automation",description:"E-commerce automation operating system"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
