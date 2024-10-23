import Log from "../Util";
import {InsightError} from "../controller/IInsightFacade";
import * as JSZip from "jszip";
import ParseIndex from "./ParseIndex";
import ParseHTML from "./ParseHTML";
const parse5 = require("parse5");

export default class UnzipRoomsDataset {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public unzipDataset(content: string): Promise<any> {
        let zip = new JSZip();
        let pi = new ParseIndex();
        let ph = new ParseHTML();
        let objectFiles: any[];
        let files: any[] = [];
        let buildings: any[] = [];

        return new Promise((resolve, reject) => {
            return zip.loadAsync(content, {base64: true}).then(function (zipContent) {
                let indexFile = Object.values(zipContent.files).filter((file) => (file.dir === false &&
                    (file.name === "rooms/index.htm"))); // file = index within root;
                if (indexFile === null || indexFile === undefined || indexFile.length === 0) {
                    throw new InsightError("No valid index file found");
                }
                objectFiles = Object.values(zipContent.files).filter((file) => file.dir === false);
                return indexFile[0].async("string");
            }).then(function (index) {
                return pi.parseIndex(parse5.parse(index));
            }).then(function (res) {
                buildings = res; // buildings = [[code, fullname, address, lat, lon]]
                files = UnzipRoomsDataset.loadFiles(buildings, objectFiles); // load all buildings that are in index
                return Promise.all(files);
            }).then(function (values) { // values = buildings in index that are stringified
                return UnzipRoomsDataset.parseValues(ph, buildings, values);
            }).then(function (fileContent) {
                if (Object.keys(fileContent).length === 0) {
                    return reject(new InsightError("No valid rooms"));
                }
                let result: any = {};
                let ind: number = 0;

                // fileContent == array, i == object, j == object
                for (let i of fileContent) {
                    Object.values(i).forEach((j) => {
                        result[ind] = j;
                        ind++;
                    });
                }
                return resolve(result);
            }).catch((Error) => {
                reject(new InsightError("Not a valid dataset"));
            });
        });
    }

    private static loadFiles(buildings: any[], objectFiles: any[]): any[] {
        let res: any[] = [];
        objectFiles.forEach((value) => {
            if (UnzipRoomsDataset.insideIndex(buildings, value.name)) {
                res.push(value.async("string"));
            }
        });
        return res;
    }

    private static getFileName(name: string): string {
        let i: number = name.lastIndexOf("\/");
        if (i !== -1) {
            return (name.substr(i + 1, name.length - 1));
        }
        return "";
    }

    private static insideIndex(index: any[], path: string): boolean {
        let name = UnzipRoomsDataset.getFileName(path);
        for (let arr of index) {
            if (arr[0] === name) {
                return true;
            }
        }
        return false;
    }

    private static parseValues(ph: ParseHTML, buildings: any[], values: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let fileContent: object[] = [];
            let i: number = 0;
            values.forEach((value) => {
                let htmlFile: any = UnzipRoomsDataset.validParse(value);
                if (htmlFile === undefined || htmlFile === null) {
                    return;
                }
                fileContent[i] = ph.parseHTML(buildings, htmlFile);
                i++;
            });
            Promise.all(fileContent).then((res) => {
                let result: object[] = res.filter(function (e) {
                    return (e !== null);
                });
                return resolve(result);
            });
        });
    }

    private static validParse(value: any): any {
        try {
            return parse5.parse(value);
        } catch (error) {
            return;
        }
    }
}
