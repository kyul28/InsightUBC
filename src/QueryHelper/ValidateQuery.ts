import {InsightError} from "../controller/IInsightFacade";
import ValidationHelpers from "./ValidationHelpers";
import Log from "../Util";

export default class ValidateQuery {
    private lComparator: string[] = ["AND", "OR"];
    private mComparator: string[] = ["LT", "GT", "EQ"];
    private applyToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    private validationHelpers: ValidationHelpers = new ValidationHelpers();
    private datasetName: string = "";
    private applyKeys: string[] = [];
    private datasetType: string = "";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public checkValid(query: any, dataset: {[id: string]: any}, dataType: string) {
        this.applyKeys = [];
        if (typeof query === "object" && query === null) {
            throw new InsightError("Unexpected response status 400: Missing WHERE"); // null query
        } else if (!Object.keys(query).includes("WHERE")) {
            throw new InsightError("Unexpected response status 400: Missing WHERE"); // missing WHERE
        } else if (!Object.keys(query).includes("OPTIONS")) {
            throw new InsightError("Unexpected response status 400: Missing OPTIONS"); // missing OPTIONS
        } else if (Object.keys(query).length > 3) {
            throw new InsightError("Unexpected response status 400: Excess keys in query"); // query with excess keys
        } else if (Object.keys(query).length === 3 && !Object.keys(query).includes("TRANSFORMATIONS")) {
            throw new InsightError("Unexpected response status 400: Excess keys in query");
        } else if (dataType === "" || typeof(dataType) !== "string") {
            throw new InsightError("Unexpected response status 400: Incorrect data type");
        } else {
            let where: any = query["WHERE"];
            let options: any = query["OPTIONS"];
            let column: string[] = options["COLUMNS"];
            let columnFirstKey;                                 // referring to dataset name
            let incTrans: string = "";
            if (Object.keys(query).includes("TRANSFORMATIONS")) {
                incTrans = "TRUE";
                columnFirstKey = query["TRANSFORMATIONS"]["GROUP"][0];
                this.datasetName = columnFirstKey.split("_")[0];
            } else {
                columnFirstKey = column[0];
                this.datasetName = String(columnFirstKey).split("_")[0];
            }
            this.datasetType = dataType;
            this.checkWhere(where, String(columnFirstKey), dataset, dataType);
            this.checkOptions(options, incTrans, dataset);
            if (Object.keys(query).includes("TRANSFORMATIONS")) {
                let trans: any = query["TRANSFORMATIONS"];
                this.checkTrans(trans, dataset, column);
            }
        }
    }

    public checkWhere(body: any, columnKey: string, dataset: {[id: string]: any}, dataType: string) {
        if (body === {} || Object.keys(body).length === 0) { // empty where
            return;
        }
        if (typeof(body) !== "object" || Object.keys(body).length > 1) {
            throw new InsightError("Unexpected response status 400: WHERE should only have 1 key, has " +
                Object.keys(length));
        }
        this.checkBody(body, columnKey, dataset, dataType);
    }

    public checkBody(body: any, columnKey: string, dataset: {[id: string]: any}, dataType: string) {
        let filter: string = Object.keys(body)[0]; // M L S N Comp
        let val: any = Object.values(body)[0]; // courses_avg: ___
        if (!this.validationHelpers.isValidFilter(filter)) {
            throw new InsightError("Unexpected response status 400: Invalid filter key: " + filter);
        }
        if (typeof(val) !== "object" || val === {} || Object.keys(val).length === 0) {
            if (filter === "IS" || this.mComparator.includes(filter)) {
                throw new InsightError("Unexpected response status 400: " + filter +
                    " should only have 1 key, has 0");
            } else {
                throw new InsightError("Unexpected response status 400: " + filter +
                    " must be a non-empty array");
            }
        }
        if (this.mComparator.includes(filter)) {
            this.validationHelpers.isValidSMKey(filter, val, columnKey, dataset);
            this.validationHelpers.checkMComp(filter, val, dataType);
        } else if (filter === "IS") {
            this.validationHelpers.isValidSMKey(filter, val, columnKey, dataset);
            this.validationHelpers.checkSComp(val, dataType);
        } else if (this.lComparator.includes(filter)) {
            this.checkLComp(filter, val, columnKey, dataset, dataType);
        } else if (filter === "NOT") {
            this.checkNComp(val, columnKey, dataset, dataType);
        }
    }

    public checkLComp(filter: string, val: any, columnKey: string, dataset: {[id: string]: any}, dataType: string) {
        if (!Array.isArray(val)) {
            throw new InsightError("Invalid query string");
        }
        if (val === undefined || val === []) {
            throw new InsightError("Unexpected response status 400: " + filter + " must be a non-empty array");
        } // empty array
        for (let obj of val) {
            this.checkBody(obj, columnKey, dataset, dataType);
        }
    }

    public checkNComp(val: any, columnKey: string, dataset: {[id: string]: any}, dataType: string) {
        if (Array.isArray(val) || typeof val !== "object") {
            throw new InsightError("Invalid query string");
        }
        if (Object.keys(val).length !== 1) {
            throw new InsightError("Unexpected response status 400: NOT should only have 1 key, has " +
                Object.keys(val).length);
        }
        this.checkBody(val, columnKey, dataset, dataType);
    }

    public checkOptions(options: any, trans: string, dataset: {[id: string]: any}) {
        if (options === {} || !Object.keys(options).includes("COLUMNS")) {
            throw new InsightError("Unexpected response status 400: OPTIONS MISSING COLUMNS");
        } else if (Object.keys(options).length > 2) {
            throw new InsightError("Unexpected response status 400: Invalid keys in OPTIONS");
        } else if (Object.keys(options).length === 2 && !(Object.keys(options).includes("COLUMNS") &&
            Object.keys(options).includes("ORDER"))) {
            throw new InsightError("Unexpected response status 400: Invalid keys in OPTIONS");
        } else {
            this.checkColumns(options["COLUMNS"], trans, dataset);
            if (Object.keys(options).length === 2) {
                this.checkOrder(options["ORDER"], options["COLUMNS"]);
            }
        }
    }

    public checkColumns(columns: any, trans: string, dataset: {[id: string]: any}) {
        if (!Array.isArray(columns)) {
            throw new InsightError("Unexpected error: COLUMNS is not given in array");
        }
        if (columns === undefined || columns === [] || columns.length === 0) {
            throw new InsightError("Unexpected response status 400: COLUMNS must be a non-empty array");
        }
        for (const key of columns) {
            if (key.includes("_")) {
                this.checkValidKey(key, dataset, this.datasetName, "COLUMNS");
            } else {
                if (trans !== "TRUE") {
                    throw new InsightError("Unexpected response status 400: invalid key in COLUMNS");
                }
            }
        }
    }

    public checkOrder(order: any, columns: string[]) {
        if (typeof order === "string") {
            if (!columns.includes(order)) {
                throw new InsightError("Unexpected response status 400: ORDER key must be in COLUMNS");
            }
        } else if (typeof order === "object") {
            if (!Object.keys(order).includes("dir") || Array.isArray(order)) {
                throw new InsightError("Unexpected response status 400: ORDER missing 'dir' key");
            } else if (Object.keys(order).length !== 2) {
                throw new InsightError("Unexpected response status 400: invalid key in ORDER");
            } else if (!Object.keys(order).includes("keys")) {
                throw new InsightError("Unexpected response status 400: ORDER missing 'keys' key");
            } else if (typeof order["dir"] !== "string" || !(order["dir"] === "UP" || order["dir"] === "DOWN")) {
                throw new InsightError("Unexpected response status 400: Invalid ORDER direction");
            } else if (!Array.isArray(order["keys"]) || (order["keys"] === []) || order["keys"].length < 1) {
                throw new InsightError("Unexpected response status 400: ORDER keys must be a non-empty array");
            }
            for (let key of order["keys"]) {
                if (typeof key !== "string" || !columns.includes(key)) {
                    throw new InsightError("Unexpected response status 400: All ORDER keys must be in COLUMNS");
                }
            }
        } else {
            throw new InsightError("Unexpected response status 400: Invalid ORDER type");
        }
    }

    private checkTrans(trans: any, dataset: { [p: string]: any }, column: string[]) {
        if (typeof trans !== "object" || trans === {} || !Object.keys(trans).includes("GROUP") ||
            Array.isArray(trans)) {
            throw new InsightError("Unexpected response status 400: TRANSFORMATIONS missing GROUP");
        } else if (!Object.keys(trans).includes("APPLY")) {
            throw new InsightError("Unexpected response status 400: TRANSFORMATIONS missing APPLY");
        } else if (Object.keys(trans).length !== 2) {
            throw new InsightError("Unexpected response status 400: Extra keys in TRANSFORMATIONS");
        } else {
            this.checkGroup(trans["GROUP"], dataset);
            this.checkApply(trans["APPLY"], dataset);
            this.checkColumnKeys(column, trans["GROUP"]);
        }
    }

    private checkGroup(group: any, dataset: { [p: string]: any }) {
        if (!Array.isArray(group) || (group === [])) {
            throw new InsightError("Unexpected response status 400: GROUP must be a non-empty array");
        }
        Object.values(group).forEach((key) => {
            if (typeof key !== "string") {
                throw new InsightError("Unexpected response status 400: key.split is not a function");
            }
            this.checkValidKey(key, dataset, this.datasetName, "GROUP");
        });
    }

    private checkValidKey(key: string, dataset: { [p: string]: any }, datasetIndex: string, part: string) {
        let keySplit: string[] = key.split("_");
        if (keySplit[0] === "") {
            throw new InsightError("Unexpected response status 400: Referenced dataset cannot be empty string");
        }
        if (!(keySplit[0] in dataset)) {
            throw new InsightError("Unexpected response status 400: Referenced dataset " + keySplit[0] +
                " not added yet");
        }
        if (keySplit[1] === "" || keySplit.length !== 2 ||
            (this.datasetType === "courses" && !this.validationHelpers.validColumnKeyC(keySplit[1])) ||
            (this.datasetType === "rooms" && !this.validationHelpers.validColumnKeyR(keySplit[1]))) {
            throw new InsightError("Unexpected response status 400: Invalid key " + key + " in " + part);
        }
        if (keySplit[0] !== datasetIndex) {
            throw new InsightError("Unexpected response status 400: Cannot query more than one dataset");
        }
        if (part === "MAX" || part === "MIN" || part === "AVG" || part === "SUM") {
            if ((this.datasetType === "courses" && !this.validationHelpers.validNumberKeyC(keySplit[1])) ||
                (this.datasetType === "rooms" && !this.validationHelpers.validNumberKeyR(keySplit[1]))) {
                throw new InsightError("Unexpected response status 400: Invalid key type in " + part);
            }
        } else if (part === "COUNT") {
            if ((this.datasetType === "courses" && !this.validationHelpers.validColumnKeyC(keySplit[1])) ||
                (this.datasetType === "rooms" && !this.validationHelpers.validColumnKeyR(keySplit[1]))) {
                throw new InsightError("Unexpected response status 400: Invalid key type in " + part);
            }
        }
    }

    private checkApply(apply: any, dataset: { [p: string]: any }) {
        if (!Array.isArray(apply)) {
            throw new InsightError("Unexpected response status 400: APPLY must be an array");
        }
        for (let value of apply) {
            if (typeof value !== "object" || Array.isArray(value)) {
                throw new InsightError("Unexpected response status 400: Apply rule must be object");
            } else if (typeof Object.keys(value)[0] !== "string" || Object.keys(value)[0].includes("_")) {
                throw new InsightError("Error: Invalid query string");
            } else if (Object.keys(value).length !== 1) {
                throw new InsightError("Unexpected response status 400: Apply rule should only have 1 key, has 2");
            } else if (this.applyKeys.includes(Object.keys(value)[0])) {
                throw new InsightError("Unexpected response status 400: Duplicate APPLY key maxSeats");
            }
            this.checkApplyRule(value, dataset);
            this.applyKeys.push(Object.keys(value)[0]);
        }
    }

    private checkColumnKeys(column: string[], group: string[]) {
        for (let key of column) {
            if (!key.includes("_")) {
                if (!this.applyKeys.includes(key)) {
                    throw new InsightError("Unexpected response status 400: Invalid key " + key + " in COLUMNS");
                }
            } else {
                if (!group.includes(key)) {
                    throw new InsightError("Unexpected response status 400: Invalid key " + key + " in COLUMNS");
                }
            }
        }
    }

    private checkApplyRule(value: any, dataset: { [p: string]: any }) {
        if (Object.keys(value)[0].includes("_") || Object.keys(value)[0] === "") {
            throw new InsightError("Unexpected response status 400: Cannot have underscore in applyKey");
        }
        if (typeof Object.values(value[Object.keys(value)[0]])[0] !== "string") {  // ApplyRule target key
            throw new InsightError("Unexpected response status 400: Invalid apply rule target key");
        } else if (Object.values(value).length !== 1 || typeof Object.values(value)[0] !== "object" ||
            Array.isArray(value)) {
            throw new InsightError("Unexpected response status 400: Excessive keys");
        }
        let applyBody: {any: string} = value[Object.keys(value)[0]];
        if (Object.keys(applyBody).length !== 1) {
            throw new InsightError("Unexpected response status 400: Apply body should only have 1 key, has 2");
        } else if (typeof Object.keys(applyBody)[0] !== "string" ||
            !(this.applyToken.includes(Object.keys(applyBody)[0]))) {
            throw new InsightError("Unexpected response status 400: Invalid transformation operator");
        }
        if (Object.keys(applyBody)[0] === "COUNT") {
            this.checkValidKey(Object.values(applyBody)[0],
                dataset, Object.values(applyBody)[0].split("_")[0], "COUNT");
        } else {
            this.checkValidKey(Object.values(applyBody)[0],
                dataset, Object.values(applyBody)[0].split("_")[0], Object.keys(applyBody)[0]);
        }
    }
}
