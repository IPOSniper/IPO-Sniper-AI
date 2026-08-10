import { NewsArticle } from "./models/NewsArticle";
import { SourceScore } from "./contracts/SourceScore";

export class SourceReliabilityEngine {

    analyze(article: NewsArticle): SourceScore {

        const source = article.source.toLowerCase();

        const ratings: Record<string, Omit<SourceScore, "source" | "confidence">> = {

            "sec": {
                reliability: 100,
                credibility: 100,
                factualAccuracy: 100,
                primarySource: true
            },

            "reuters": {
                reliability: 96,
                credibility: 95,
                factualAccuracy: 95,
                primarySource: false
            },

            "bloomberg": {
                reliability: 95,
                credibility: 94,
                factualAccuracy: 94,
                primarySource: false
            }

        };

        const match = Object.keys(ratings)
            .find(key => source.includes(key));

        const rating = match
            ? ratings[match]
            : {
                reliability: 70,
                credibility: 70,
                factualAccuracy: 70,
                primarySource: false
            };

        return {

            source: article.source,

            ...rating,

            confidence:
                (rating.reliability +
                 rating.credibility +
                 rating.factualAccuracy) / 3

        };

    }

}
