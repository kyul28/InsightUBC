import Log from "../Util";

export default class BuildHelpersRooms {

    constructor() {
        Log.trace("QueryHelper::init()");
    }

    public sortByOrder(order: any, result: any[]): any[] {
        return result.sort((a, b) => (a[order] > b[order]) ? 1 : ((b[order] > a[order]) ? -1 : 0));
    }

    public sortByOrderObj(order: any, result: any[]): any[] {
        let used: string[] = [];
        order["keys"].forEach((value: string, index: number) => {
            if (value.includes("_")) {
                value = value.split("_")[1];
            }
            if (index === 0) {
                result = this.sortByOrder(value, result);
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

    public processColumn(column: string[], res: any[], trans: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let dataName: string = column[0].split("_")[0];
            if (trans === "TRUE") {
                res.forEach((value) => {
                    Object.keys(value).forEach((value1) => {
                        if (column.includes(value1)) {
                            if (value1.endsWith("_lat") || value1.endsWith("_lon") || value1.endsWith("_seats")
                                || !value1.includes("_")) {
                                value[value1] = Number(value[value1]);
                            }
                        } else {
                            delete value[value1];
                        }
                    });
                });
            } else {
                res.forEach((value) => {
                    Object.keys(value).forEach((value1) => {
                        let key = dataName + "_" + value1;
                        if (!column.includes(key)) {
                            delete value[value1];
                        } else {
                            value[key] = value[value1];
                            delete value[value1];
                        }
                    });
                });
            }
            return resolve(res);
        });
    }

}
