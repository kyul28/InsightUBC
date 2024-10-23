import Log from "../Util";
import {InsightError} from "../controller/IInsightFacade";
import * as JSZip from "jszip";

export default class UnzipCoursesDataset {
    private jsonKeys: string[] = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id",
        "Year", "Section"];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public unzipDataset(content: string): Promise<any> {
        let zip = new JSZip();
        let jsonKeys: string[] = this.jsonKeys;
        return new Promise((resolve, reject) => {
            let i: number = 0;
            return zip.loadAsync(content, {base64: true}).then(function (zipContent) {
                if (UnzipCoursesDataset.checkZip(zipContent)) {
                    throw new InsightError("No courses directory");
                }
                let files: any[] = [];
                let objectFiles = Object.values(zipContent.files).filter((file) => file.dir === false);
                objectFiles.forEach((value) => {
                    if (value.name.match(new RegExp("courses\/.*"))) {
                        files.push(value.async("string"));
                    }
                });
                return Promise.all(files);
            }).then(function (values) {
                let fileContent: any = {};
                values.forEach((value, index, array) => {
                    let jsonFile: any = UnzipCoursesDataset.validParse(value);
                    if (jsonFile === undefined || index < (array.length - 1) && jsonFile["result"].length === 0) {
                        return;
                    }
                    jsonFile = UnzipCoursesDataset.removeOuterObject(jsonFile);
                    for (let elem in jsonFile) {
                        if (!(UnzipCoursesDataset.receiveValidSections(jsonFile, elem))) {
                            return;
                        }
                        jsonFile = UnzipCoursesDataset.deleteUnrelatedKeys(jsonFile, elem, jsonKeys);
                        fileContent[i] = jsonFile[elem];
                        i++;
                    }
                });
                if (Object.keys(fileContent).length === 0) {
                    return reject(new InsightError("No valid courses"));
                }
                return resolve(fileContent);
            }).catch((error) => {
                reject(new InsightError("Not a zip file"));
            });
        });
    }

    public static deleteUnrelatedKeys(jsonFile: any, elem: any, jsonKeys: any): Promise<any> {
        Object.keys(jsonFile[elem]).forEach(function (key) {
            if (!jsonKeys.includes(key)) {
                delete jsonFile[elem][key];
            }
            if (key === "Section" && jsonFile[elem][key] === "overall") {
                jsonFile[elem]["Year"] = 1900;
            }
        });
        return jsonFile;
    }

    public static checkZip(zipContent: JSZip): boolean {
        return (zipContent.file(new RegExp("courses\/.*[^\/]")).length === 0 ||
            zipContent.file(new RegExp("courses\\/[^\\/]*\\/")).length > 0 ||
            zipContent.file(new RegExp(".+courses\\/")).length > 0 );
    }

    private static validParse(value: any): any {
        try {
            return JSON.parse(value);
        } catch (error) {
            return;
        }
    }

    private static removeOuterObject(obj: any): Promise<any> {
        if (obj.hasOwnProperty("result")) {
            Object.assign(obj, obj["result"]);
            delete obj["result"];
            delete obj["rank"];
        }
        return obj;
    }

    private static receiveValidSections(course: any, section: any): boolean {
        if (course[section].hasOwnProperty("Subject") && course[section].hasOwnProperty("Course") &&
            course[section].hasOwnProperty("Avg") && course[section].hasOwnProperty("Professor") &&
            course[section].hasOwnProperty("Title") && course[section].hasOwnProperty("id") &&
            course[section].hasOwnProperty("Pass") && course[section].hasOwnProperty("Fail") &&
            course[section].hasOwnProperty("Audit") && course[section].hasOwnProperty("Year")) {
            return true;
        } else {
            delete course[section];
            return false;
        }
    }
}
