import {Automation,Connector} from "./types";

// No seeded automation runs or business outcomes. Real records will come from the database/runtime.
export const automations:Automation[]=[];

// Ecommerce connector catalog. Do not advertise unverified integrations as live.
export const connectors:Connector[]=[
{id:"shopify",name:"Shopify",category:"Commerce",status:"available",description:"Official OAuth: orders, customers, products and inventory"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"available",description:"Official REST API: store, orders, customers and products"},
{id:"amazon",name:"Amazon",category:"Marketplace",status:"available",description:"Seller Central authorization; operational SP-API access must be configured"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"available",description:"Seller API integration; validate credentials against official seller APIs"},
{id:"meesho",name:"Meesho",category:"Marketplace",status:"coming-soon",description:"Awaiting verified official seller API access; no guessed endpoints or fake connection status"},
{id:"whatsapp",name:"WhatsApp",category:"Messaging",status:"available",description:"Official Meta Cloud API credentials and messaging events"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"available",description:"Official API credentials: payments, refunds and webhooks"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"available",description:"Official API token: orders, shipments and tracking"},
{id:"quick-commerce",name:"Quick Commerce",category:"Marketplace",status:"coming-soon",description:"No official adapter configured yet"}
];
