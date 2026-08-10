import type { ReactNode } from "react";

export default function RightSidebar({
    children,
}:{
    children:ReactNode;
}){

    return(
        <div className="space-y-6 sticky top-6">
            {children}
        </div>
    )

}
