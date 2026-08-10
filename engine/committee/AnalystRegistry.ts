import { InvestmentAnalyst }
from "./InvestmentAnalyst";

export class AnalystRegistry{

    private analysts:
        InvestmentAnalyst[]=[];

    register(
        analyst:InvestmentAnalyst
    ){

        this.analysts.push(
            analyst
        );

    }

    getAll(){

        return this.analysts;

    }

}
