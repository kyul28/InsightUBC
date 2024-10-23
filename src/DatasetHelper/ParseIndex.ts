import {InsightError} from "../controller/IInsightFacade";
import Log from "../Util";
import * as http from "http";

export default class ParseIndex {

    public parseIndex(content: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let tableChild: any[] = ParseIndex.getTable(content);
            let codes: string[] = [];
            let fullNames: string[] = [];
            let addresses: string[] = [];
            let lats: number[] = [];
            let lons: number[] = [];
            if (tableChild === null || tableChild === undefined || tableChild.length === 0) {
                return ([]);
            }
            for (let child of tableChild) {
                if (child.nodeName !== "#text") {
                    codes.push(ParseIndex.getCode(child));
                    fullNames.push(ParseIndex.getFullName(child));
                    addresses.push(ParseIndex.getAddress(child));
                }
            }
            let res: Promise<any> = ParseIndex.setGeolocation(codes, fullNames, addresses, lats, lons);
            return resolve(res);
        });
    }

    private static getTable(element: any): any[] {
        if (element.nodeName === "table" && this.validTableAttribute(element.attrs)) {
            return ParseIndex.getBody(element.childNodes);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleTable = this.getTable(child);
                if (possibleTable.length !== 0) {
                    return possibleTable;
                }
            }
        }
        return [];
    }

    public static validTableAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-table cols-5 table") {
                return true;
            }
        }
        return false;
    }

    private static getBody(childNodes: any[]): any[] {
        for (let child of childNodes) {
            if (child.nodeName === "tbody" && child.childNodes) {
                return child.childNodes;
            }
        }
        return null;
    }

    private static getCode(element: any): string {
        if (element.nodeName === "td" && this.validCodeAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleCode = this.getCode(child);
                if (possibleCode !== "") {
                    return possibleCode;
                }
            }
        }
        return "";
    }

    private static validCodeAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-field views-field-field-building-code") {
                return true;
            }
        }
        return false;
    }

    private static getFullName(element: any): string {
        if (element.nodeName === "a" && this.validNameAttribute(element.attrs) &&
            element.childNodes[0].nodeName !== "img") {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleFullName = this.getFullName(child);
                if (possibleFullName !== "") {
                    return possibleFullName;
                }
            }
        }
        return "";
    }

    private static validNameAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "href" && a.value.startsWith("./campus/discover/buildings-and-classrooms/")) {
                return true;
            }
        }
        return false;
    }

    private static getAddress(element: any): string {
        if (element.nodeName === "td" && this.validAddressAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleAddress = this.getAddress(child);
                if (possibleAddress !== "") {
                    return possibleAddress;
                }
            }
        }
        return "";
    }

    private static validAddressAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-field views-field-field-building-address") {
                return true;
            }
        }
        return false;
    }

    private static setGeolocation(codes: string[], fullNames: string[], addresses: string[],
                                  lats: number[], lons: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            Promise.all(ParseIndex.setGeolocationHelper(addresses)).then((output) => {
                let arrayIndex: number = 0;
                for (let obj of output) {
                    if (obj["lat"] !== null &&  obj["lon"] !== null &&
                        obj["lat"] !== undefined &&  obj["lon"] !== undefined) {
                        lats = ParseIndex.addGeolocation(lats, obj.lat);
                        lons = ParseIndex.addGeolocation(lons, obj.lon);
                    } else {
                        codes = ParseIndex.removeElement(codes, arrayIndex);
                        fullNames = ParseIndex.removeElement(fullNames, arrayIndex);
                        addresses = ParseIndex.removeElement(addresses, arrayIndex);
                    }
                    arrayIndex++;
                }
                let building: any[] = [];
                for (let i in codes) {
                    building.push([codes[i], fullNames[i], addresses[i], lats[i], lons[i]]);
                }
                return resolve(building);
            }).catch((error) => {
                Log.trace(error);
                return reject(new InsightError("What is this"));
            });
        }).catch((error) => {
            Log.trace(error);
            return (new InsightError("I don't get it"));
        });
    }

    private static addGeolocation(geo: number[], val: number) {
        geo.push(val);
        return geo;
    }

    private static setGeolocationHelper(addresses: string[]): any[] {
        let res: any[] = [];
        addresses.forEach((address) => {
            res.push(ParseIndex.fetchGeolocation(address));
        });
        return res;
    }


    private static fetchGeolocation(address: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team183/" +
                encodeURIComponent(address.trim());
            http.get(URL, (res) => {
                let rawData = "";
                res.on("data", (chunk) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        return resolve(parsedData);
                    } catch (error) {
                        return resolve(null);
                    }
                });
            }).on("error", (e) => {
                    return resolve(null);
            });
        }).catch((error) => {
            Log.trace(error);
        });
    }

    private static removeElement(arr: string[], index: number): string[] {
        if (index > -1) {
            arr = arr.splice(index, 1);
        }
        return arr;
    }
}
