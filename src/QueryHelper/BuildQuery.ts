import {ResultTooLargeError} from "../controller/IInsightFacade";
import Log from "../Util";
import BuildQueryHelpers from "./BuildQueryHelpers";
import BuildHelpersCourses from "./BuildHelpersCourses";

export default class QueryHelpers {
    private lComparator: string[] = ["AND", "OR"];
    private mComparator: string[] = ["LT", "GT", "EQ"];
    private buildQueryHelper: BuildQueryHelpers = new BuildQueryHelpers();
    private buildHelperCourses: BuildHelpersCourses = new BuildHelpersCourses();
    private columnKeysFilter: string[] = [];
    private orderFilter: any = {};

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public setOptions(query: any) {
        let options: any = query["OPTIONS"];
        if (Object.keys(options).includes("ORDER")) {
            this.orderFilter = options["ORDER"];
        }
        this.columnKeysFilter = options["COLUMNS"];
    }

    public buildQuery(query: any, data: {[id: string]: any}, dataType: string): Promise<any[]> {
        let result: any[] = [];
        this.setOptions(query);
        let input = JSON.parse(JSON.stringify(data)); // Creating a Copy of data to not modify the original
        return new Promise((resolve, reject) => {
            result = this.detectComparator(query, input, dataType);
            let transformed = "";
            if (Object.keys(query).includes("TRANSFORMATIONS")) {
                result = this.runTransform(query["TRANSFORMATIONS"], result, dataType);
                transformed = "TRUE";
            }
            this.buildQueryHelper.makeProperResult(this.columnKeysFilter, this.orderFilter, result, dataType,
                transformed).then((res) => {
                return resolve(res);
            }).catch((error) => {
                return reject(new ResultTooLargeError("Too large"));
            });
        });
    }

    public detectComparator(body: any, data: {[id: string]: any}, dataType: string): any[] {
        let filter: string = Object.keys(body["WHERE"])[0];
        let val: any = Object.values(body["WHERE"])[0];
        return this.runQuery(filter, val, data, dataType);
    }

    private runQuery(filter: string, val: any, data: any, dataType: string) {
        if (this.mComparator.includes(filter)) {
            return this.buildQueryHelper.runMComp(filter, val, data, dataType);
        } else if (filter === "IS") {
            return this.buildQueryHelper.runSComp(val, data, dataType);
        } else if (this.lComparator.includes(filter)) {
            return this.runLComp(filter, val, data, dataType);
        } else if (filter === "NOT") {
            return this.runNComp(val, data, dataType);
        } else {
            let res: any = [];
            Object.keys(data).forEach(function (aClass) {
                let value = data[aClass];
                res.push(value);
            });
            return res;
        }
    }

    public runLComp(filter: string, val: any, file: { [p: string]: any }, dataType: string): any[] {
        let res: any[] = [];
        let res1: any[] = [];
        let numOfFilter: number = 0;
        if (filter === "OR") {
            Object.keys(val).forEach((value, index) => {
                let filter1: string = Object.keys(val[value])[0];
                if (index === 0) {
                    res = this.runQuery(filter1, Object.values(val[value])[0], file, dataType);
                    return;
                }
                let res2 = this.runQuery(filter1, Object.values(val[value])[0], file, dataType);
                res2.forEach((value1: any) => {
                    if (!res.includes(value1)) {
                        res.push(value1);
                    }
                });
            });
            return res;
        } else {
            Object.keys(val).forEach((value) => {
                let filter1: string = Object.keys(val[value])[0];
                res1.push(this.runQuery(filter1, Object.values(val[value])[0], file, dataType));
                numOfFilter += 1;
            });
        }
        let countMap = new Map<object, number>();
        res1.forEach((eachFilter, index) => {
            if (index === 0) {
                eachFilter.forEach((value: any) => {
                    countMap.set(value, 1);
                });
            } else {
                eachFilter.forEach((value: any) => {
                    if (countMap.has(value)) {
                        countMap.set(value, countMap.get(value) + 1);
                    } else {
                        return;
                    }
                });
            }
        });
        for (let [key, value] of countMap) {
            if (value === numOfFilter) {
                res.push(key);
            }
        }
        return res;
    }

    public runNComp(val: any, file: { [p: string]: any }, dataType: string): any[] {
        let reverse: any[] = [];
        let res: any[] = [];
        let doubleNeg: number = 0;
        Object.keys(val).forEach((value) => {
            let temp: any[] = [];
            if (this.mComparator.includes(value)) {
                temp = this.buildQueryHelper.runMComp(value, val[value], file, dataType);
            } else if (value === "IS") {
                temp = this.buildQueryHelper.runSComp(val[value], file, dataType);
            } else if (this.lComparator.includes(value)) {
                temp = this.runLComp(value, val[value], file, dataType);
            } else if (value === "NOT") {
                res = this.runQuery(Object.keys(val[value])[0], Object.values(val[value])[0], file, dataType);
                doubleNeg = 1;
            }
            temp.forEach((value1) => {
                if (!reverse.includes(value1)) {
                    reverse.push(value1);
                }
            });
        });
        if (doubleNeg === 1) {
            return res;
        }
        Object.values(file).forEach((value2) => {
            if (!reverse.includes(value2)) {
                res.push(value2);
            }
        });
        return res;
    }

    private runTransform(trans: any, data: any, dataType: string): any[] {
        let res = this.runGroupComp(trans["GROUP"], data, dataType);
        if (trans["APPLY"].length !== 0) {
            res = this.runApply(trans["APPLY"], res, dataType);
        }
        return this.mapToArray(res);
    }

    private runGroupComp(group: string[], data: any, dataType: string): Map<string, any[]> {
        let groups: Map<string, any[]> = new Map<string, any[]>();
        let keys: string[] = [];
        if (dataType === "courses") {
            for (let i in group) {
                keys[i] = this.buildHelperCourses.resetKeys(group[i]);
            }
        } else {
            for (let i in group) {
                keys[i] = group[i].split("_")[1];
            }
        }
        Object.values(data).forEach((value: any) => {
            let mapKey = "";
            for (let i in group) {
                mapKey = mapKey + group[i] + "**" + value[keys[i]] + "**";
            }
            if (!groups.has(mapKey)) {
                groups.set(mapKey, [value]);
            } else {
                let temp = groups.get(mapKey);
                temp.push(value);
                groups.set(mapKey, temp);
            }
        });
        return groups;
    }

    private runApply(apply: any[], res: Map<string, any[]>, dataType: string): Map<string, any[]> {
        let counter = 0;
        for (let [subKey, subGroup] of res) {
            if (counter === res.size) {
                break;
            }
            apply.forEach((apKey) => {
                let temp = "";
                let applyKey = Object.values(Object.values(apKey)[0])[0];
                if (Object.keys(Object.values(apKey)[0])[0] === "MAX") {
                    temp = this.buildQueryHelper.computeMax(applyKey, subGroup, dataType);
                } else if (Object.keys(Object.values(apKey)[0])[0] === "MIN") {
                    temp = this.buildQueryHelper.computeMin(applyKey, subGroup, dataType);
                } else if (Object.keys(Object.values(apKey)[0])[0] === "AVG") {
                    temp = this.buildQueryHelper.computeAvg(applyKey, subGroup, dataType);
                } else if (Object.keys(Object.values(apKey)[0])[0] === "SUM") {
                    temp = this.buildQueryHelper.computeSum(applyKey, subGroup, dataType);
                } else {
                    temp = this.buildQueryHelper.computeCount(applyKey, subGroup, dataType);
                }
                res.set(subKey + Object.keys(apKey)[0] + "**" + temp + "**", []);
                res.delete(subKey);
                subKey = subKey + Object.keys(apKey)[0] + "**" + temp + "**";
            });
            counter ++;
        }
        return res;
    }

    private mapToArray(res: Map<string, any[]>): any[] {
        let result: any[] = [];
        for (let key of res.keys()) {
            let splitted = key.split("**");
            let temp: object = {};
            splitted.forEach((value, index) => {
                if (index === 0) {
                    if (value.endsWith("_avg") || value.endsWith("_pass") || value.endsWith("_fail")
                        || value.endsWith("_audit") || value.endsWith("_year") || !value.includes("_")) {
                        temp = {[value]: Number(splitted[index + 1])};
                    } else {
                        temp = {[value]: splitted[index + 1]};
                    }
                } else if (index % 2 === 0 && value !== "") {
                    if (value.endsWith("_avg") || value.endsWith("_pass") || value.endsWith("_fail")
                        || value.endsWith("_audit") || value.endsWith("_year") || !value.includes("_")) {
                        Object.assign(temp, {[value]: Number(splitted[index + 1])});
                    } else {
                        Object.assign(temp, {[value]: splitted[index + 1]});
                    }
                } else {
                    return;
                }
            });
            result.push(temp);
        }
        return result;
    }
}
