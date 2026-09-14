import {Automation,Connector} from "./types";

// No seeded automation runs or business outcomes. Real records will come from the database/runtime.
export const automations:Automation[]=[];

// Keep the connector catalog for the UI, but never claim a provider is connected until its real
// authentication flow has completed. GitHub is the only connector currently implemented end-to-end.
export const connectors:Connector[]=[
{id:"github",name:"GitHub",category:"Developer",status:"available",description:"Repositories, files, issues and pull requests"},
{id:"shopify",name:"Shopify",category:"Commerce",status:"coming-soon",description:"Orders, customers, products, inventory and webhooks"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"coming-soon",description:"Store, orders, customers and product data"},
{id:"amazon",name:"Amazon",category:"Marketplace",status:"coming-soon",description:"Marketplace orders and catalog data"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"coming-soon",description:"Marketplace order and listing integration"},
{id:"myntra",name:"Myntra",category:"Marketplace",status:"coming-soon",description:"Fashion marketplace integration"},
{id:"magento",name:"Magento",category:"Commerce",status:"coming-soon",description:"Catalog, customers and order events"},
{id:"bigcommerce",name:"BigCommerce",category:"Commerce",status:"coming-soon",description:"Storefront and commerce data"},
{id:"wix",name:"Wix",category:"Commerce",status:"coming-soon",description:"Store and customer integration"},
{id:"google-sheets",name:"Google Sheets",category:"Data",status:"coming-soon",description:"Import/export operational datasets"},
{id:"gmail",name:"Gmail",category:"Messaging",status:"coming-soon",description:"Transactional and operational email"},
{id:"whatsapp",name:"WhatsApp",category:"Messaging",status:"coming-soon",description:"Customer and campaign messaging"},
{id:"meta",name:"Meta",category:"Ads",status:"coming-soon",description:"Facebook and Instagram ads/events"},
{id:"google-ads",name:"Google Ads",category:"Ads",status:"coming-soon",description:"Campaigns, audiences and performance"},
{id:"tiktok",name:"TikTok",category:"Ads",status:"coming-soon",description:"Ads and audience workflows"},
{id:"klaviyo",name:"Klaviyo",category:"Marketing",status:"coming-soon",description:"Profiles, segments and campaigns"},
{id:"stripe",name:"Stripe",category:"Payments",status:"coming-soon",description:"Payments, refunds and financial events"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"coming-soon",description:"Payments, refunds and Indian payment events"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"coming-soon",description:"Shipping, tracking and fulfillment"},
{id:"delhivery",name:"Delhivery",category:"Fulfillment",status:"coming-soon",description:"Shipment and tracking events"}
];
