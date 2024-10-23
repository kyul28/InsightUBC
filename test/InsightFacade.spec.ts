import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        validInvalidFile: "./test/data/coursesValidInvalidFile.zip",
        validInvalidJSON: "./test/data/coursesValidInvalidJSON.zip",
        validLittle: "./test/data/coursesValidLittle.zip",
        validMultiple: "./test/data/coursesValidMultiple.zip",
        validNoSection: "./test/data/coursesValidNoSection.zip",
        validOneSection: "./test/data/coursesValidOneSection.zip",
        validOneCourse: "./test/data/coursesValidOneCourse.zip",
        invalidEmpty: "./test/data/coursesInvalidEmpty.zip",
        invalidInvalidFile: "./test/data/coursesInvalidInvalidFile.zip",
        invalidInvalidJSON: "./test/data/coursesInvalidInvalidJSON.zip",
        invalidFile: "./test/data/courses.txt",
        invalidName: "./test/data/coursesInvalidName.zip",
        invalidNoSection: "./test/data/coursesInvalidNoSection.zip",
        invalidMultipleEmpty: "./test/data/coursesInvalidMultipleEmpty.zip",
        invalidMultipleWrongName: "./test/data/coursesInvalidMultipleWrongName.zip",
        emptyCourse: "./test/data/courseEmpty.zip",
        emptyCourses: "./test/data/coursesEmpty.zip",
        oneEmptyCourse: "./test/data/coursesOneEmptyCourse.zip",
        oneValidSection: "./test/data/coursesOneValidSection.zip",
        nestedCourse: "./test/data/coursesNestedCourse.zip",
        nested: "./test/data/coursesNested.zip",
        oneTextFile: "./test/data/coursesOneTextFile.zip",
        allTextFiles: "./test/data/coursesAllTextFiles.zip",
        math: "./test/data/coursesMath.zip",
        rooms: "./test/data/rooms.zip",
        roomsValidLittle: "./test/data/roomsValidLittle.zip",
        roomsValidOneBuilding: "./test/data/roomsValidOneBuilding.zip",
        roomsInvalidNoRooms: "./test/data/roomsInvalidNoRooms.zip",
        roomsInvalidBuilding: "./test/data/roomsInvalidBuilding.zip",
        roomsInvalidIndex: "./test/data/roomsInvalidIndex.zip",
        roomsInvalidNestedIndex: "./test/data/roomsInvalidNestedIndex.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";
    this.timeout(30000);

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        const dataDir = "../data";
        fs.removeSync(dataDir);
        fs.mkdirSync(dataDir);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        this.timeout(30000);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        const dataDir = "../data";
        fs.removeSync(dataDir);
        fs.mkdirSync(dataDir);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // Unit test for rooms
    /**
     * add dataset
     */

    it("Should add a valid dataset for Rooms", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, rooms dataset with one building", function () {
        const id: string = "roomsValidOneBuilding";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Invalid invalid rooms", function () {
        const id: string = "roomsInvalidBuilding";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid no valid rooms", function () {
        const id: string = "roomsInvalidNoRooms";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid no index file", function () {
        const id: string = "roomsInvalidIndex";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid index file not in root", function () {
        const id: string = "roomsInvalidNestedIndex";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid not a zip file", function () {
        const id: string = "   ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Unit tests for courses. You should create more like this!
    /**
     * add dataset
     */
    it("Should add a valid dataset for Courses", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, whitespace with valid characters", function () {
        const id: string = " courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["oneValidSection"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains invalid file", function () {
        const id: string = "validInvalidFile";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains small amount of courses", function () {
        const id: string = "validLittle";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains multiple folders", function () {
        const id: string = "validMultiple";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains courses with no sections", function () {
        const id: string = "validNoSection";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains courses with one section", function () {
        const id: string = "validOneSection";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, one course", function () {
        const id: string = "validOneCourse";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains an invalid File", function () {
        const id: string = "validInvalidFile";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, contains a JSON file of wrong format", function () {
        const id: string = "validInvalidJSON";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add a dataset with multiple valid course but one empty course", function () {
        const id: string = "oneEmptyCourse";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Valid, two valid datasets", function () {
        let id: string = "courses";
        let expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expected)
            .then(() => {
                id = "validLittle";
                expected.push(id);
                futureResult = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult).to.eventually.deep.equal(expected);
            });
    });

    it("Valid, reject first and accept second dataset", function () {
        let id: string = "invalidName";
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError).then(() => {
            id = "validLittle";
            let expected = [id];
            futureResult = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("Valid, accept first and reject second dataset", function () {
        let id: string = "validLittle";
        let expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            id = "invalidName";
            expected = [id];
            futureResult = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return expect(futureResult).to.be.rejectedWith(InsightError);
        });
    });

    it("Valid, reject second dataset with same id", function () {
        const id: string = "validLittle";
        const expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expected)
            .then(() => {
                futureResult = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult).to.be.rejectedWith(InsightError);
            });
    });

    it("Invalid id, whitespace", function () {
        const id: string = "   ";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid id, underscore", function () {
        const id: string = "cour_ses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject dataset with one empty course", function () {
        const id: string = "emptyCourse";
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject dataset with multiple empty courses", function () {
        const id: string = "emptyCourses";
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, empty zip", function () {
        const id: string = "invalidEmpty";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, txt file", function () {
        const id: string = "invalidFile";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, no courses folder", function () {
        const id: string = "invalidName";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, no sections in courses folder", function () {
        const id: string = "invalidNoSection";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, only invalid JSON format files in zip", function () {
        const id: string = "invalidInvalidJSON";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, multiple folders && no sections in courses folder", function () {
        const id: string = "invalidMultipleEmpty";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, multiple folders && no courses folder", function () {
        const id: string = "invalidMultipleWrongName";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, null id", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            null,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, null dataset", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            null,
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, null dataset kind", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            null,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, undefined id", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            undefined,
            datasets[id],
            InsightDatasetKind.Courses,
        );

        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, undefined dataset", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            undefined,
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, undefined dataset kind", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            undefined,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject a non-existing id", function () {
        const id: string = "mathCourses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id],
            InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject a non-existent dataset", function () {
        const id: string = "nonExistent";
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, "./test/data/coursesNestedCourse.zip",
            InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Invalid, reject first and reject second dataset", function () {
        let id: string = "invalidName";
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.be.rejectedWith(InsightError)
            .then(() => {
                id = "invalidNoSection";
                futureResult = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult).to.be.rejectedWith(InsightError);
            });
    });

    it("Valid, accept same dataset with different id twice", function () {
        let id: string = "validLittle";
        let expected: string[] = [id];
        let futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected).then(() => {
            id = "validLittle1";
            expected.push(id);
            futureResult = insightFacade.addDataset(
                id,
                datasets["validLittle"],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    });

    it("Should reject nested course dataset zip", function () {
        const id: string = "nestedCourse";
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Should reject non course nested dataset zip", function () {
        const id: string = "nested";
        const futureResult: Promise<string[]> =
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    /**
     * remove dataset
     */
    it("Valid, delete a dataset", function () {
        const id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                const expected2: string = id;
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.eventually.deep.equal(
                    expected2,
                );
            });
    });

    it("Valid, add 2 and delete 2, in 1221 order", function () {
        let id: string = "validLittle";
        let expected1: string[] = [id];
        let futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "courses";
                expected1.push(id);
                futureResult1 = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult1)
                    .to.eventually.deep.equal(expected1)
                    .then(() => {
                        let expected2: string = id;
                        let futureResult2: Promise<
                            string
                            > = insightFacade.removeDataset(id);
                        return expect(futureResult2)
                            .to.eventually.deep.equal(expected2)
                            .then(() => {
                                id = "validLittle";
                                expected2 = id;
                                futureResult2 = insightFacade.removeDataset(id);
                                return expect(
                                    futureResult2,
                                ).to.eventually.deep.equal(expected2);
                            });
                    });
            });
    });

    it("Valid, add 2 and delete 2, in 1212 order", function () {
        let id: string = "validLittle";
        let expected1: string[] = [id];
        let futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "courses";
                expected1.push(id);
                futureResult1 = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult1)
                    .to.eventually.deep.equal(expected1)
                    .then(() => {
                        id = "validLittle";
                        let expected2: string = id;
                        let futureResult2: Promise<
                            string
                            > = insightFacade.removeDataset(id);
                        return expect(futureResult2)
                            .to.eventually.deep.equal(expected2)
                            .then(() => {
                                id = "courses";
                                expected2 = id;
                                futureResult2 = insightFacade.removeDataset(id);
                                return expect(
                                    futureResult2,
                                ).to.eventually.deep.equal(expected2);
                            });
                    });
            });
    });

    it("Invalid, deleting dataset with underscore", function () {
        let id: string = "courses";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "oneValid_Section";
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.be.rejectedWith(InsightError);
            });
    });

    it("Invalid, deleting dataset with only whitespace", function () {
        let id: string = "courses";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "  ";
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.be.rejectedWith(InsightError);
            });
    });

    it("Invalid, deleting dataset with whitespace and non-existing dataset", function () {
        let id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = " nonExistent ";
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.be.rejectedWith(NotFoundError);
            });
    });

    it("Invalid, delete dataset with undefined id", function () {
        const id: string = "courses";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(undefined);
                return expect(futureResult2).to.be.rejectedWith(InsightError);
            });
    });

    it("Invalid, delete dataset with null id", function () {
        const id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(null);
                return expect(futureResult2).to.be.rejectedWith(InsightError);
            });
    });

    it("Invalid, delete non-existing dataset", function () {
        let id: string = "courses";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "validLittle";
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.be.rejectedWith(NotFoundError);
            });
    });

    it("Invalid, delete a deleted dataset", function () {
        const id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1).to.eventually.deep.equal(expected1).then(() => {
            const expected2: string = id;
            const futureResult2: Promise<string> = insightFacade.removeDataset(id);
            return expect(futureResult2).to.eventually.deep.equal(expected2).then(() => {
                const futureResult3: Promise<string> = insightFacade.removeDataset(id);
                return expect(futureResult3).to.be.rejectedWith(NotFoundError);
            });
        });
    });

    it("Invalid, delete invalid dataset", function () {
        let id: string = "invalidEmpty";
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.be.rejectedWith(InsightError)
            .then(() => {
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2).to.be.rejectedWith(NotFoundError);
            });
    });


    /**
     * list dataset
     */
    it("Add a rooms dataset and list the added dataset, type, and number of rows", function () {
        const id: string = "rooms";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult1).to.eventually.deep.equal(expected1).then(() => {
            const result: InsightDataset = {
                id : id,
                kind : InsightDatasetKind.Rooms,
                numRows: 364
            };
            const expected2: InsightDataset[] = [result];
            const futureResult2: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult2).to.eventually.deep.equal(expected2);
        });
    });

    it("Add a courses dataset and list the added dataset, type, and number of rows", function () {
        const id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1).to.eventually.deep.equal(expected1).then(() => {
            const result: InsightDataset = {
                id : id,
                kind : InsightDatasetKind.Courses,
                numRows: 92
            };
            const expected2: InsightDataset[] = [result];
            const futureResult2: Promise<InsightDataset[]> = insightFacade.listDatasets();
            return expect(futureResult2).to.eventually.deep.equal(expected2);
        });
    });

    it("No datasets added", function () {
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        const expected: InsightDataset[] = [];
        expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Add an invalid dataset, reject, and check for empty list", function () {
        const id: string = "invalidEmpty";
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.be.rejectedWith(InsightError)
            .then(() => {
                const futureResult2: Promise<InsightDataset[]> = insightFacade.listDatasets();
                const expected: InsightDataset[] = [];
                expect(futureResult2).to.eventually.deep.equal(expected);
            });
    });

    it("Add a dataset, delete it, and check for empty list", function () {
        const id: string = "validLittle";
        const expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                const expected2: string = id;
                const futureResult2: Promise<
                    string
                    > = insightFacade.removeDataset(id);
                return expect(futureResult2)
                    .to.eventually.deep.equal(expected2)
                    .then(() => {
                        const futureResult3: Promise<
                            InsightDataset[]
                            > = insightFacade.listDatasets();
                        const expected3: InsightDataset[] = [];
                        expect(futureResult3).to.eventually.deep.equal(expected3);
                    });
            });
    });

    it("Add 1 valid and 1 invalid datasets, and check the list for one entry", function () {
        let id: string = "validLittle";
        let expected1: string[] = [id];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                id = "invalidEmpty";
                const futureResult2: Promise<
                    string[]
                    > = insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult2)
                    .to.be.rejectedWith(InsightError)
                    .then(() => {
                        const result: InsightDataset = {
                            id : "validLittle",
                            kind : InsightDatasetKind.Courses,
                            numRows: 92
                        };
                        const expected2: InsightDataset[] = [result];
                        const futureResult3: Promise<InsightDataset[]> = insightFacade.listDatasets();
                        return expect(futureResult3).to.eventually.deep.equal(expected2);
                    });
            });
    });

    it("Add 2 valid datasets, check for two entries", function () {
        const id1: string = "validLittle";
        let expected1: string[] = [id1];
        const futureResult1: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult1).to.eventually.deep.equal(expected1)
            .then(() => {
                const dataset1: InsightDataset = {
                    id: id1,
                    kind: InsightDatasetKind.Courses,
                    numRows: 92
                };
                let expected2: InsightDataset[] = [dataset1];
                let futureResult2: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(futureResult2).to.eventually.deep.equal(expected2).then( () => {
                    const id2: string = "validOneSection";
                    const expected3 = [id1, id2];
                    const futureResult3: Promise<string[]> = insightFacade.addDataset(id2, datasets[id2],
                        InsightDatasetKind.Courses);
                    return expect(futureResult3).to.eventually.deep.equal(expected3).then ( () => {
                        const dataset2: InsightDataset = {
                            id: id2,
                            kind: InsightDatasetKind.Courses,
                            numRows: 1
                        };
                        let expected4: InsightDataset[] = [dataset1, dataset2];
                        let futureResult4: Promise<InsightDataset[]> = insightFacade.listDatasets();
                        return expect(futureResult4).to.eventually.deep.equal(expected4);
                    });
                });
            });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        valid: {
            path: "./test/data/coursesOneValidSection.zip",
            kind: InsightDatasetKind.Courses
        },
        rooms: {
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms
        }

    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);
        this.timeout(30000);
        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }
        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        const dataDir = "../data";
        fs.removeSync(dataDir);
        fs.mkdirSync(dataDir);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
