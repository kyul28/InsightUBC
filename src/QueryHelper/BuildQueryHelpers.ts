import Log from "../Util";
import {ResultTooLargeError} from "../controller/IInsightFacade";
import BuildHelpersCourses from "./BuildHelpersCourses";
import BuildHelpersRooms from "./BuildHelpersRooms";
import Decimal from "decimal.js";

export default class BuildQueryHelpers {
    private buildHelperCourses: BuildHelpersCourses = new BuildHelpersCourses();
    private buildHelperRooms: BuildHelpersRooms = new BuildHelpersRooms();

    constructor() {
        Log.trace("QueryHelper::init()");
    }

    public runMComp(filter: string, val: any, file: { [p: string]: any }, dataType: string): any[] {
        let okey = Object.keys(val)[0];
        let mkey = okey.split("_")[1];
        let mval = Object.values(val)[0];
        if (dataType === "courses") {
            mkey = mkey.charAt(0).toUpperCase() + mkey.slice(1);
        }
        if (filter === "GT") {
            return this.MCompGT(mkey, mval, file);
        } else if (filter === "LT") {
            return this.MCompLT(mkey, mval, file);
        } else {
            return this.MCompEQ(mkey, mval, file);
        }
    }

    public runSComp(val: any, file: { [p: string]: any }, dataType: string): any[] {
        let okey = Object.keys(val)[0];
        let sval = Object.values(val)[0];
        let skey = okey.split("_")[1];
        if (dataType === "courses") {
            if (okey.endsWith("dept")) {
                skey = "Subject";
            } else if (okey.endsWith("uuid")) {
                skey = "id";
            } else if (okey.endsWith("id")) {
                skey = "Course";
            } else if (okey.endsWith("instructor")) {
                skey = "Professor";
            } else {
                skey = "Title";
            }
            return this.SCompIS(skey, sval, file, dataType);
        }
        return this.SCompIS(skey, sval, file, dataType);
    }

    public MCompGT(mkey: string, mval: any, data: any): any[] {
        let res: any[] = [];
        let tData: any = data;
        Object.keys(tData).forEach(function (aClass) {
            let value = tData[aClass];
            Object.keys(value).forEach(function (key, index) {
                if (key !== mkey) {
                    return;
                }
                if (Number(Object.values(value)[index]) > mval) {
                    res.push(value);
                }
            });
        });
        return res;
    }

    public MCompLT(mkey: string, mval: unknown, data: any): any[] {
        let res: any[] = [];
        let tData: any = data;
        Object.keys(tData).forEach(function (aClass) {
            let value = tData[aClass];
            Object.keys(value).forEach(function (key, index) {
                if (key !== mkey) {
                    return;
                }
                if (Number(Object.values(value)[index]) < mval) {
                    res.push(value);
                }
            });
        });
        return res;
    }

    public MCompEQ(mkey: string, mval: unknown, data: any): any[] {
        let res: any[] = [];
        let tData: any = data;
        Object.keys(tData).forEach(function (aClass) {
            let value = tData[aClass];
            Object.keys(value).forEach(function (key, index) {
                if (key !== mkey) {
                    return;
                }
                if (Number(Object.values(value)[index]) === mval) {
                    res.push(value);
                }
            });
        });
        return res;
    }

    public SCompIS(skey: string, sval: any, data: any, dataType: string): any[] {
        let res: any[] = [];
        let tData: any = data;
        Object.keys(tData).forEach(function (aClass) {
            let value = tData[aClass];
            Object.keys(value).forEach(function (key) {
                if (key !== skey || (sval === "" && dataType === "courses" && skey !== "Professor" &&
                    skey !== "Title")) {
                    return;
                }
                let sTemp: string = "";
                if (sval === "*" || sval === "**") {
                    res.push(value);
                    return;
                }
                if (sval.charAt(0) === "*" && sval.charAt(sval.length - 1) === "*") {
                    sTemp = sval.slice(1, -1);
                    if ((value[key] + "").search(sTemp) !== -1) {
                        res.push(value);
                    }
                } else if (sval.charAt(0) === "*") {
                    sTemp = sval.slice(1);
                    if ((value[key] + "").endsWith(sTemp)) {
                        res.push(value);
                    }
                } else if (sval.charAt(sval.length - 1) === "*") {
                    sTemp = sval.slice(0, -1);
                    if ((value[key] + "").startsWith(sTemp)) {
                        res.push(value);
                    }
                } else {
                    if ((value[key] + "") === sval) {
                        res.push(value);
                    }
                }
            });
        });
        return res;
    }

    public makeProperResult(column: any, order: any, result: any[], dataType: string, trans: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (result.length === 0) {
                return resolve([]);
            } else if (result.length > 5000) {
                return reject(new ResultTooLargeError("too large"));
            } else {
                let res: any[] = result;
                if (dataType === "courses" && typeof order === "string") {
                    res = this.buildHelperCourses.sortByOrder(order, result, trans);
                } else if (dataType === "courses") {
                    res = this.buildHelperCourses.sortByOrderObj(order, result, trans);
                } else if (dataType === "rooms" && typeof order === "string") {
                    if (order.includes("_")) {
                        res = this.buildHelperRooms.sortByOrder(order.split("_")[1], result);
                    } else {
                        res = this.buildHelperRooms.sortByOrder(order, result);
                    }
                } else if (dataType === "rooms") {
                    res = this.buildHelperRooms.sortByOrderObj(order, result);
                }
                try {
                    if (dataType === "courses") {
                        if (trans === "TRUE") {
                            return resolve(this.buildHelperCourses.processColumnT(column, res));
                        }
                        return resolve(this.buildHelperCourses.processColumn(column, res));
                    }
                    return resolve(this.buildHelperRooms.processColumn(column, res, trans));
                } catch (error) {
                    return reject(error("Should not have been thrown"));
                }

            }
        });
    }

    public computeMax(value: string, subGroup: any[], dataType: string): string {
        let result = 0;
        if (dataType === "courses") {
            value = this.buildHelperCourses.resetKeys(value);
        } else {
            value = value.split("_")[1];
        }
        for (let course of subGroup) {
            Object.keys(course).forEach((value1) => {
                if (value1 !== value) {
                    return;
                }
                if (Number(course[value1]) > result) {
                    result = Number(course[value1]);
                }
            });
        }
        return result + "";
    }

    // set first item as first item of array instead of arbitrary val
    // write one test for every group key / group by everything
    public computeMin(value: string, subGroup: any[], dataType: string): string {
        let result = 9000000;
        if (dataType === "courses") {
            value = this.buildHelperCourses.resetKeys(value);
        } else {
            value = value.split("_")[1];
        }
        for (let course of subGroup) {
            Object.keys(course).forEach((value1) => {
                if (value1 !== value) {
                    return;
                }
                if (Number(course[value1]) < result) {
                    result = Number(course[value1]);
                }
            });
        }
        return result + "";
    }

    public computeAvg(value: string, subGroup: any[], dataType: string): string {
        let total = new Decimal(0);
        let numRows: number = 0;
        if (dataType === "courses") {
            value = this.buildHelperCourses.resetKeys(value);
        } else {
            value = value.split("_")[1];
        }
        for (let course of subGroup) {
            Object.keys(course).forEach((value1) => {
                if (value1 !== value) {
                    return;
                }
                total = total.add(new Decimal(course[value1]));
                numRows++;
            });
        }
        let result = total.toNumber() / numRows;
        result = Number(result.toFixed(2));
        return result + "";
    }

    public computeSum(value: string, subGroup: any[], dataType: string): string {
        let total = new Decimal(0);
        if (dataType === "courses") {
            value = this.buildHelperCourses.resetKeys(value);
        } else {
            value = value.split("_")[1];
        }
        for (let course of subGroup) {
            Object.keys(course).forEach((value1) => {
                if (value1 !== value) {
                    return;
                }
                let val = new Decimal(course[value1]);
                total = Decimal.add(total, val);
            });
        }
        let result = Number(total.toFixed(2));
        return result + "";
    }

    public computeCount(value: string, subGroup: any[], dataType: string): string {
        let list: string[] = [];
        let count = 0;
        if (dataType === "courses") {
            value = this.buildHelperCourses.resetKeys(value);
        } else {
            value = value.split("_")[1];
        }
        for (let course of subGroup) {
            Object.keys(course).forEach((value1) => {
                if (value1 !== value) {
                    return;
                }
                if (!list.includes(course[value1])) {
                    list.push(course[value1]);
                    count++;
                }
            });
        }
        return count + "";
    }
}
