import Log from "../Util";
import {InsightError} from "../controller/IInsightFacade";

export default class ValidationHelpers {
    private compKeys: string[] = ["LT", "GT", "EQ", "IS", "NOT", "AND", "OR"];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public isValidFilter(filter: string): boolean {
        return this.compKeys.includes(filter);
    }

    public checkMComp(filter: string, val: any, dataType: string) {
        let mKey: string = Object.keys(val)[0];
        let mVal: any = Object.values(val)[0];
        this.isValidMComp(filter, mKey, mVal, dataType);
    }

    public checkSComp(val: any, dataType: string) {
        let sKey: string = Object.keys(val)[0];
        let sVal: any = Object.values(val)[0];
        this.isValidSComp(sKey, sVal, dataType);
    }

    public isValidSMKey(filter: string, val: any, columnKey: string, dataset: {[id: string]: any}) {
        if (typeof(val) !== "object" || Object.keys(val).length !== 1) {
            throw new InsightError(filter + " should have 1 key, has " + Object.keys(val).length);
        }
        let key: string = Object.keys(val)[0]; // courses_avg:
        let split: string[] = key.split("_");
        let columnSplit: string = columnKey.split("_")[0];
        if (!(columnSplit in dataset) || columnSplit.includes("_") || columnSplit === "") {
            throw new InsightError("Unexpected response status 400: Unexpected response status 400: " +
                "Referenced dataset " + columnSplit + " not added yet");
        }
        if (split[0] !== columnSplit || split[0] === "") {
            throw new InsightError("Unexpected response status 400: Cannot query more than one dataset");
        }
        if (split.length !== 2) {
            throw new InsightError("Unexpected response status 400: Invalid key " + key + " in " + filter);
        }
        if (!(split[0] in dataset)) {
            throw new InsightError("Unexpected response status 400: Referenced dataset " + split[0] +
                " not added yet");
        }
    }

    public isValidMComp(filter: string, key: string, val: any, type: string) { // courses_avg, ______
        if (typeof val !== "number" || !this.validType(val)) {
            throw new InsightError("Unexpected response status 400: Invalid value type in " + key +
                ", should be number");
        }
        let split: string[] = key.split("_");
        if (type === "courses") {
            if (!this.validNumberKeyC(split[1])) {
                throw new InsightError("Unexpected response status 400: Invalid key " + key + " in " + filter);
            }
        } else {
            if (!this.validNumberKeyR(split[1])) {
                throw new InsightError("Unexpected response status 400: Invalid key " + key + " in " + filter);
            }
        }
    }

    public isValidSComp(key: string, val: any, type: string) {
        let format = /[*]/;
        if (format.test(val) === true) {
            this.validAsterisk(key, val);
        }
        if (typeof val !== "string" || !this.validType(val)) {
            throw new InsightError("Unexpected response status 400: Invalid value type in IS, should be string");
        }
        let split: string[] = key.split("_");
        if (type === "courses") {
            if (!this.validStringKeyC(split[1])) {
                throw new InsightError("Unexpected response status 400: Invalid key " + key + " in IS");
            }
        } else {
            if (!this.validStringKeyR(split[1])) {
                throw new InsightError("Unexpected response status 400: Invalid key " + key + " in IS");
            }
        }
    }

    public validAsterisk(key: string, val: any) {
        let value: string = String(val);
        let count = value.match(/[*]/g).length;
        if (count === 1) {
            if (value.charAt(0) !== "*" && value.charAt(value.length - 1) !== "*") { // if 0 = *
                throw new InsightError("Unexpected response status 400: Asterisks (*) can only be the first or" +
                    "last characters of input strings");
            }
        } else if (count === 2) {
            if (!(value.charAt(0) === "*" && value.charAt(value.length - 1) === "*")) {
                throw new InsightError("Unexpected response status 400: Asterisks (*) can only be the first or" +
                    "last characters of input strings");
            }
        }
        if (count >= 3) {
            throw new InsightError("Unexpected response status 400: Asterisks (*) can only be the first or last " +
                "characters of input strings");
        }
    }

    public validNumberKeyC(key: string): boolean {
        return (key === "avg" || key === "pass" || key === "fail" || key === "audit" || key === "year");
    }

    public validStringKeyC(key: string): boolean {
        return (key === "dept" || key === "id" || key === "instructor" || key === "title" || key === "uuid");
    }

    public validNumberKeyR(key: string): boolean {
        return (key === "lat" || key === "lon" || key === "seats");
    }

    public validStringKeyR(key: string): boolean {
        return (key === "fullname" || key === "shortname" || key === "number" || key === "name" || key === "address"
            || key === "type" || key === "furniture" || key === "href");
    }

    public validType(val: any): boolean {
        let value: string = JSON.stringify(val);
        let alphaNum = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i;
        return (!value.match(alphaNum));
    }

    public validColumnKeyC(key: string): boolean {
        return (key === "dept" || key === "id" || key === "avg" || key === "instructor" || key === "title" ||
            key === "pass" || key === "fail" || key === "audit" || key === "uuid" || key === "year");
    }

    public validColumnKeyR(key: string): boolean {
        return (key === "lat" || key === "lon" || key === "seats" || key === "fullname" || key === "shortname" ||
            key === "number" || key === "name" || key === "address" || key === "type" || key === "furniture" ||
            key === "href");
    }

}
