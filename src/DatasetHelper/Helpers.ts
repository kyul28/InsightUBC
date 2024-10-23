import Log from "../Util";
import * as fs from "fs-extra";
import {InsightDatasetKind} from "../controller/IInsightFacade";
export default class Helpers {
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public loadDatasets(): any {
        const dataDirectory = "./data/";
        try {
            if (!fs.existsSync(dataDirectory)) {
                fs.mkdirSync(dataDirectory);
            }
            let listData: {[id: string]: any} = {};
            let datasets: string[] = fs.readdirSync(dataDirectory);
            for (const id of datasets) {
                let content: string = fs.readFileSync(dataDirectory + id, "utf8");
                // listData.push(id);
                listData[id] = content;
            }
            return listData;
        } catch (error) {
            Log.error(error);
            return (error.message);
        }
    }

    public sectionSum(s: string): number {
        try {
            let count = s.match(/Section/g);
            if (count === null) {
                return 0;
            }
            return (count.length);
        } catch (error) {
            Log.error();
        }
    }

    public roomSum(s: string): number {
        try {
            // Log.trace(s);
            let count = s.match(/href/g);
            if (count === null) {
                return 0;
            }
            return (count.length);
        } catch (error) {
            Log.error();
        }
    }

    public identifyKind(s: string): InsightDatasetKind {
        try {
            if (s.includes("_")) {
                let kind: string = s.split("_")[1];
                if (kind === "courses") {
                    return InsightDatasetKind.Courses;
                } else if (kind === "rooms") {
                    return InsightDatasetKind.Rooms;
                }
            }
        } catch (error) {
            Log.error();
        }
    }
}
