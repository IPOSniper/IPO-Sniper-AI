
import { ComponentType } from "react";

export interface WorkstationPanel{

    id:string;

    title:string;

    region:"left"|"center"|"right"|"bottom";

    order:number;

    component:ComponentType<any>;

}

