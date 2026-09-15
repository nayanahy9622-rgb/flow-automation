import {Automation,Connector} from "./types";

// No seeded automation runs or business outcomes. Real records will come from the database/runtime.
export const automations:Automation[]=[];

// Ecommerce connector catalog. Providers are shown as available only when a real
// connection/data implementation exists; persisted authentication determines connected state.
export const connectors:Connector[]=[
{id:"shopify",name:"Shopify",category:"Commerce",status:"available",description:"Official OAuth: orders, customers, products, inventory and webhooks"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"available",description:"Official REST credentials: store, orders, customers and products"},
{id:"amazon",name:"Amazon",category:"Marketplace",status:"available",description:"Official Seller Central OAuth and SP-API data"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"available",description:"Official seller API credentials and order data"},
{id:"meesho",name:"Meesho",category:"Marketplace",status:"available",description:"Official seller credentials where enabled for your account"},
{id:"whatsapp",name:"WhatsApp",category:"Messaging",status:"available",description:"Official Meta Cloud API credentials and messaging events"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"available",description:"Official API credentials: payments, refunds and webhooks"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"available",description:"Official API token: orders, shipments and tracking"},
{id:"quick-commerce",name:"Quick Commerce",category:"Marketplace",status:"coming-soon",description:"No official adapter configured yet"}
];
