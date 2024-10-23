import Log from "../Util";

export default class BuildHelpersCourses {

    constructor() {
        Log.trace("QueryHelper::init()");
    }

    public sortByOrder(order: any, result: any[], trans: string): any[] {
        if (trans !== "TRUE") {
            order = this.resetKeys(order);
        }
        if (order === "Pass" || order === "Fail" || order.endsWith("_pass") || order.endsWith("_fail")) {
            result.sort((a, b) => (Number(a[order]) > Number(b[order])) ? 1 :
                ((Number(b[order]) > Number(a[order])) ? -1 : 0));
        } else {
            result.sort((a, b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
        }
        return result;
    }

    public sortByOrderObj(order: any, result: any[], trans: string): any[] {
        if (trans !== "TRUE") {
            for (let i in order["keys"]) {
                order["keys"][i] = this.resetKeys(order["keys"][i]);
            }
        }
        let used: string[] = [];
        order["keys"].forEach((value: string, index: number) => {
            if (index === 0) {
                result = this.sortByOrder(value, result, trans);
                used.push(value);
                return;
            }
            result.forEach((value1, index1) => {
                if (index1 === result.length - 1) {
                    return;
                }
                for (let i in used) {
                    if (value1[used[i]] !== result[index1 + 1][used[i]]) {
                        return;
                    }
                }
                if (value1[value] > result[index1 + 1][value]) {
                    let temp: any = value1;
                    result[index1] = result[index1 + 1];
                    result[index1 + 1] = temp;
                }
            });
            used.push(value);
        });
        if (order["dir"] === "DOWN") {
            result.reverse();
        }
        return result;
    }

    public resetKeys(order: string): string {
        if (order.endsWith("_dept")) {
            order = "Subject";
        } else if (order.endsWith("_uuid")) {
            order = "id";
        } else if (order.endsWith("_id")) {
            order = "Course";
        } else if (order.endsWith("_instructor")) {
            order = "Professor";
        } else if (order.endsWith("_pass")) {
            order = "Pass";
        } else if (order.endsWith("_fail")) {
            order = "Fail";
        } else if (order.endsWith("_avg")) {
            order = "Avg";
        } else if (order.endsWith("_audit")) {
            order = "Audit";
        } else if (order.endsWith("_year")) {
            order = "Year";
        } else if (order.endsWith("_title")) {
            order = "Title";
        }
        return order;
    }

    public processColumn(column: string[], res: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let id = column[0].split("_")[0];
            res.forEach((value) => {
                Object.keys(value).forEach((value1) => {
                    if (value1 === "Subject") {
                        BuildHelpersCourses.correctKey(column, id, "_dept", value, value1);
                    } else if (value1 === "id") {
                        BuildHelpersCourses.correctKey(column, id, "_uuid", value, value1);
                    } else if (value1 === "Course") {
                        BuildHelpersCourses.correctKey(column, id, "_id", value, value1);
                    } else if (value1 === "Professor") {
                        BuildHelpersCourses.correctKey(column, id, "_instructor", value, value1);
                    } else if (value1 === "Pass") {
                        BuildHelpersCourses.correctKey(column, id, "_pass", value, value1);
                    } else if (value1 === "Fail") {
                        BuildHelpersCourses.correctKey(column, id, "_fail", value, value1);
                    } else if (value1 === "Audit") {
                        BuildHelpersCourses.correctKey(column, id, "_audit", value, value1);
                    } else if (value1 === "Year") {
                        BuildHelpersCourses.correctKey(column, id, "_year", value, value1);
                    } else if (value1 === "Avg") {
                        BuildHelpersCourses.correctKey(column, id, "_avg", value, value1);
                    } else if (value1 === "Title") {
                        BuildHelpersCourses.correctKey(column, id, "_title", value, value1);
                    } else {
                        delete value[value1];
                    }
                });
            });
            return resolve(res);
        });
    }

    private static correctKey(column: string[], id: string, key: string, value: any, value1: string) {
        if (column.includes(id + key)) {
            value[id + key] = value[value1];
            if (key === "_year") {
                value[id + key] = Number(value[value1]);
            } else if (key === "_uuid") {
                value[id + key] = (value[value1] + "");
            }
        }
        delete value[value1];
    }

    public processColumnT(column: string[], res: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            res.forEach((value) => {
                Object.keys(value).forEach((value1) => {
                    if (column.includes(value1)) {
                        if (value1.endsWith("_avg") || value1.endsWith("_pass") || value1.endsWith("_fail")
                            || value1.endsWith("_audit") || value1.endsWith("_year") || !value1.includes("_")) {
                            value[value1] = Number(value[value1]);
                        }
                    } else {
                        delete value[value1];
                    }
                });
            });
            return resolve(res);
        });
    }
}
