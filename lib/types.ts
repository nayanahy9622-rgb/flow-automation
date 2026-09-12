export type ConnectorStatus="connected"|"available"|"error";
export type Category="Sales"|"Marketing"|"Customers"|"Inventory"|"Finance"|"Data";
export type Automation={id:string;name:string;category:Category;trigger:string;status:"active"|"paused"|"draft";runs:number;result:string};
export type Connector={id:string;name:string;category:string;status:ConnectorStatus;description:string;meta?:string|null};
