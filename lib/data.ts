import {Automation,Connector} from "./types";
export const automations:Automation[]=[
{id:"a1",name:"Recover abandoned carts",category:"Sales",trigger:"Checkout abandoned",status:"active",runs:1284,result:"₹2.18L recovered"},
{id:"a2",name:"VIP customer win-back",category:"Customers",trigger:"No purchase for 60 days",status:"active",runs:428,result:"₹86.4K influenced"},
{id:"a3",name:"Low-stock protection",category:"Inventory",trigger:"Stock below threshold",status:"active",runs:96,result:"12 alerts"},
{id:"a4",name:"New collection launch",category:"Marketing",trigger:"Collection published",status:"paused",runs:18,result:"₹1.42L influenced"},
{id:"a5",name:"Payment failure recovery",category:"Finance",trigger:"Payment failed",status:"active",runs:214,result:"₹38.2K recovered"}
];
export const connectors:Connector[]=[
{id:"shopify",name:"Shopify",category:"Commerce",status:"connected",description:"Orders, customers, products, inventory and webhooks"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"available",description:"Store, orders, customers and product data"},
{id:"amazon",name:"Amazon",category:"Marketplace",status:"available",description:"Marketplace orders and catalog data"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"available",description:"Marketplace order and listing integration"},
{id:"myntra",name:"Myntra",category:"Marketplace",status:"available",description:"Fashion marketplace integration"},
{id:"magento",name:"Magento",category:"Commerce",status:"available",description:"Catalog, customers and order events"},
{id:"bigcommerce",name:"BigCommerce",category:"Commerce",status:"available",description:"Storefront and commerce data"},
{id:"wix",name:"Wix",category:"Commerce",status:"available",description:"Store and customer integration"},
{id:"google-sheets",name:"Google Sheets",category:"Data",status:"available",description:"Import/export operational datasets"},
{id:"gmail",name:"Gmail",category:"Messaging",status:"available",description:"Transactional and operational email"},
{id:"whatsapp",name:"WhatsApp",category:"Messaging",status:"available",description:"Customer and campaign messaging"},
{id:"meta",name:"Meta",category:"Ads",status:"available",description:"Facebook and Instagram ads/events"},
{id:"google-ads",name:"Google Ads",category:"Ads",status:"available",description:"Campaigns, audiences and performance"},
{id:"tiktok",name:"TikTok",category:"Ads",status:"available",description:"Ads and audience workflows"},
{id:"klaviyo",name:"Klaviyo",category:"Marketing",status:"available",description:"Profiles, segments and campaigns"},
{id:"stripe",name:"Stripe",category:"Payments",status:"available",description:"Payments, refunds and financial events"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"available",description:"Payments, refunds and Indian payment events"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"available",description:"Shipping, tracking and fulfillment"},
{id:"delhivery",name:"Delhivery",category:"Fulfillment",status:"available",description:"Shipment and tracking events"}
];
