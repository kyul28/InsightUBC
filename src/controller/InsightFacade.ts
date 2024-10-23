import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import UnzipCoursesDataset from "../DatasetHelper/UnzipCoursesDataset";
import UnzipRoomsDataset from "../DatasetHelper/UnzipRoomsDataset";
import * as fs from "fs-extra";
import DatasetHelpers from "../DatasetHelper/Helpers";
import ValidateQuery from "../QueryHelper/ValidateQuery";
import BuildQuery from "../QueryHelper/BuildQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private allDataset: { [id: string]: any } = {};
    private datasets: string[] = [];
    private datasetHelpers: DatasetHelpers = new DatasetHelpers();
    private validateQuery: ValidateQuery = new ValidateQuery();
    private buildQuery: BuildQuery = new BuildQuery();
    private datasetName: string = "";
    private datasetType: string = "";

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.allDataset = this.datasetHelpers.loadDatasets();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (id === null || id === undefined || id.includes("_") || id.match(/^\s*$/) !== null) {
                return reject(new InsightError("Invalid id"));
            }
            if (kind === null || kind === undefined) {
                return reject(new InsightError("Invalid kind"));
            }
            if (content === null || content === undefined) {
                return reject(new InsightError("Invalid content"));
            }
            if ((this.allDataset !== null) && (this.allDataset !== undefined) && (id in this.allDataset)) {
                return reject(new InsightError("duplicate id is invalid"));
            }
            try {
                if (kind === InsightDatasetKind.Courses) {
                    let unzipCoursesHelper: UnzipCoursesDataset = new UnzipCoursesDataset();
                    unzipCoursesHelper.unzipDataset(content).then((result) => {
                        if (Object.keys(result).length === 0) {
                            reject(new InsightError("Only empty courses"));
                        }
                        this.allDataset[id] = result;
                        this.datasets.push(id + "_courses");
                        fs.writeFileSync(__dirname + "/../../data/" + id + ".json",
                            JSON.stringify(this.allDataset[id]));
                        resolve(Object.keys(this.allDataset));
                    }).catch((error) => {
                        return reject(new InsightError("error"));
                    });
                } else if (kind === InsightDatasetKind.Rooms) {
                    let unzipRoomsHelper: UnzipRoomsDataset = new UnzipRoomsDataset();
                    unzipRoomsHelper.unzipDataset(content).then((result) => {
                        if (Object.keys(result).length === 0) {
                            reject(new InsightError("Only empty rooms"));
                        }
                        this.allDataset[id] = result;
                        this.datasets.push(id + "_rooms");
                        fs.writeFileSync(__dirname + "/../../data/" + id + ".json",
                            JSON.stringify(this.allDataset[id]));
                        resolve(Object.keys(this.allDataset));
                    }).catch((error) => {
                        return reject(new InsightError("error"));
                    });
                }
            } catch (error) {
                return reject(new InsightError(error));
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (id === null || id === undefined || id.includes("_") || id.match(/^\s*$/) !== null) {
                return reject(new InsightError("Invalid id"));
            }
            if (Object.keys(this.allDataset).length === 0) {
                return reject(new NotFoundError());
            }
            let keys = Object.keys(this.allDataset);
            if (keys.includes(id)) {
                delete this.allDataset[id];
                for (let val of this.datasets) {
                    let split: string = val.split("_")[0];
                    if (id === split) {
                        let index: number = this.datasets.indexOf(val);
                        if (index > -1) {
                            this.datasets.splice(index, 1);
                        }
                    }
                }
                fs.unlinkSync(__dirname + "/../../data/" + id + ".json");
                return resolve(id);
            }
            return reject(new NotFoundError());
        });
    }

    /**
     * Perform a query on insightUBC.
     *
     * @param query  The query to be performed.
     *
     * If a query is incorrectly formatted, references a dataset not added (in memory or on disk),
     * or references multiple datasets, it should be rejected.
     *
     * @return Promise <any[]>
     *
     * The promise should fulfill with an array of results.
     * The promise should reject with a ResultTooLargeError (if the query returns too many results)
     * or an InsightError (for any other source of failure) describing the error.
     */

    public performQuery(query: any): Promise<any[]> {
        return new Promise((resolve, reject) => {
            try {
                if (Object.keys(query).includes("TRANSFORMATIONS") &&
                    Object.keys(query["TRANSFORMATIONS"]).includes("GROUP")) {
                    let firstKey = query["TRANSFORMATIONS"]["GROUP"][0];
                    this.datasetName = firstKey.split("_")[0];
                } else if (Object.keys(query).includes("OPTIONS") &&
                    Object.keys(query["OPTIONS"]).includes("COLUMNS")) {
                    let columnFirstKey = query["OPTIONS"]["COLUMNS"][0];
                    this.datasetName = String(columnFirstKey).split("_")[0];
                }
                this.datasets.forEach((value) => {
                    if (value.startsWith(this.datasetName)) {
                        if (value.endsWith("courses")) {
                            this.datasetType = "courses";
                        } else if (value.endsWith("rooms")) {
                            this.datasetType = "rooms";
                        }
                    }
                });
                this.validateQuery.checkValid(query, this.allDataset, this.datasetType);
                this.buildQuery.buildQuery(query, this.allDataset[this.datasetName], this.datasetType)
                    .then((result) => {
                        return resolve(result);
                    }).catch((error) => {
                    return reject(new ResultTooLargeError("too large"));
                });
            } catch (error) {
                Log.error(InsightError);
                return reject(new InsightError("Insight Error thrown"));
            }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {
            let result: InsightDataset[] = [];
            if (this.allDataset.size === 0) {
                return resolve([]);
            }
            try {
                for (let key of this.datasets) {
                    let val: string = JSON.stringify(this.allDataset[key.split("_")[0]]);
                    let dataKind: InsightDatasetKind = this.datasetHelpers.identifyKind(key);
                    if (dataKind === InsightDatasetKind.Courses) {
                        let dataset: InsightDataset = {
                            id: key.split("_")[0],
                            kind: dataKind,
                            numRows: this.datasetHelpers.sectionSum(val)
                        };
                        result.push(dataset);
                    } else if (dataKind === InsightDatasetKind.Rooms) {
                        let dataset: InsightDataset = {
                            id: key.split("_")[0],
                            kind: dataKind,
                            numRows: this.datasetHelpers.roomSum(val)
                        };
                        result.push(dataset);
                    }
                }
                return resolve(result);
            } catch (error) {
                Log.error(error);
                return reject(error("Error occurred while listing datasets"));
            }
        });
    }
}
