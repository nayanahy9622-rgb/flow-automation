import {Automation,Connector} from "./types";

// No seeded automation runs or business outcomes. Real records will come from the database/runtime.
export const automations:Automation[]=[];

// Ecommerce connector catalog. A provider is never shown as connected until its real
// authentication flow has completed. Shopify is the first connector planned for activation.
export const connectors:Connector[]=[
{id:"shopify",name:"Shopify",category:"Commerce",status:"coming-soon",description:"Orders, customers, products, inventory and webhooks"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"coming-soon",description:"Store, orders, customers and product data"},
{id:"amazon",name:"Amazon",category:"Marketplace",status:"coming-soon",description:"Marketplace orders and catalog data"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"coming-soon",description:"Marketplace order and listing integration"},
{id:"meesho",name:"Meesho",category:"Marketplace",status:"coming-soon",description:"Marketplace order and catalog integration"},
{id:"whatsapp",name:"WhatsApp",category:"Messaging",status:"coming-soon",description:"Customer and campaign messaging"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"coming-soon",description:"Payments, refunds and Indian payment events"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"coming-soon",description:"Shipping, tracking and fulfillment"},
{id:"quick-commerce",name:"Quick Commerce",category:"Marketplace",status:"coming-soon",description:"Quick-commerce order and inventory integrations"}
];
