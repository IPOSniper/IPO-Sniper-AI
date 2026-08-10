import type { BusinessFundamentals } from "@/engine/types/BusinessFundamentals";

interface Props{
    companyName:string;
    fundamentals:BusinessFundamentals;
}

export default function BusinessFundamentalsWidget({
    companyName,
    fundamentals
}:Props){

    return(
        <div className="rounded-xl border p-4 bg-white shadow">
            <h2 className="font-semibold">
                {companyName}
            </h2>

            <p>
                Score: {fundamentals.overall.score}
            </p>

            <p>
                {fundamentals.overall.summary}
            </p>
        </div>
    );

}
