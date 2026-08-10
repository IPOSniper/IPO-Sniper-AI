export interface EvidencePackage {

    company:any;

    financial:any;

    management:any;

    ipo:any;

    market:any;

    industry:any;

    news:any;

    sec:any;

    verification:any;

    knowledge:any;

    metadata?:{

        ticker:string;

        generatedAt:Date;

        providers:string[];

    };

    citations?:any[];

    confidence?:number;

}
