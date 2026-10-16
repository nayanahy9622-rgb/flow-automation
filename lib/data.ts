import {Automation,Connector} from "./types";

// No seeded automation runs or business outcomes. Real records come from the database/runtime.
export const automations:Automation[]=[];

// "Available" means an implemented live adapter exists; provider registration and account access may still be required.
export const connectors:Connector[]=[
{id:"shopify",name:"Shopify",category:"Commerce",status:"available",description:"OAuth and live store, orders, customers, products and inventory data"},
{id:"woocommerce",name:"WooCommerce",category:"Commerce",status:"available",description:"REST API credentials; live store status, products, orders and customers"},
{id:"bigcommerce",name:"BigCommerce",category:"Commerce",status:"available",description:"OAuth; live store, products, orders and customers"},
{id:"magento",name:"Magento / Adobe Commerce",category:"Commerce",status:"available",description:"Admin API token; live products and orders"},
{id:"amazon",name:"Amazon Seller Central",category:"Marketplace",status:"coming-soon",description:"Authorization flow exists; live SP-API data adapter and role configuration are still required"},
{id:"flipkart",name:"Flipkart",category:"Marketplace",status:"available",description:"Seller API credentials; live seller order search"},
{id:"meesho",name:"Meesho",category:"Marketplace",status:"coming-soon",description:"Awaiting verified official seller API access; no guessed endpoints or fake connection status"},
{id:"whatsapp",name:"WhatsApp Business",category:"Messaging",status:"available",description:"Meta Cloud API; validate phone-number account and quality metadata"},
{id:"razorpay",name:"Razorpay",category:"Payments",status:"available",description:"API credentials; live balance and payments"},
{id:"stripe",name:"Stripe",category:"Payments",status:"available",description:"OAuth; live connected-account, balance and charge data"},
{id:"shiprocket",name:"Shiprocket",category:"Fulfillment",status:"available",description:"API token; live order data"},
{id:"delhivery",name:"Delhivery",category:"Fulfillment",status:"available",description:"API token; live package tracking data"},
{id:"meta",name:"Meta Ads",category:"Marketing",status:"available",description:"OAuth; live Meta account and ad-account metadata"},
{id:"tiktok",name:"TikTok",category:"Marketing",status:"available",description:"OAuth; live authorized profile metadata"},
{id:"klaviyo",name:"Klaviyo",category:"Marketing",status:"available",description:"OAuth; live account metadata"},
{id:"gmail",name:"Gmail",category:"Messaging",status:"available",description:"OAuth; syncs live Gmail profile and latest message metadata/snippets; send actions are not implemented"},
{id:"google-sheets",name:"Google Sheets",category:"Data",status:"available",description:"OAuth; lists real spreadsheets and syncs up to 100 rows from the first tab of the 10 most recently modified spreadsheets"},
{id:"google-ads",name:"Google Ads",category:"Marketing",status:"coming-soon",description:"OAuth/data adapter still needs Google Ads API developer token and customer reporting implementation"},
{id:"wix",name:"Wix Stores",category:"Commerce",status:"coming-soon",description:"OAuth flow exists; live Wix store data adapter is not yet implemented"},
{id:"quick-commerce",name:"Quick Commerce",category:"Marketplace",status:"coming-soon",description:"No verified provider-specific adapter configured"}
];
