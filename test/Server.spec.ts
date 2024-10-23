import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import Log from "../src/Util";
import * as fs from "fs-extra";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;

describe("Facade D3", function () {
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        coursesValidLittle: "./test/data/coursesValidLittle.zip",
        coursesInvalidEmptyCourses: "./test/data/coursesEmpty.zip",
        rooms: "./test/data/rooms.zip",
        roomsValidLittle: "./test/data/roomsValidLittle.zip",
        roomsInvalidNoRooms: "./test/data/roomsInvalidNoRooms.zip",
    };
    const validQueryCourses: any = {
        WHERE: {
            GT: {
                courses_avg: 97
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };
    const validQueryRooms: any = {
        WHERE: {

        },
        OPTIONS: {
            COLUMNS: [
                "rooms_shortname",
                "rooms_lat"
            ],
            ORDER: {
                dir: "DOWN",
                keys: [
                    "rooms_shortname",
                    "rooms_lat"
                ]
            }
        }
    };
    const invalidQueryCourses: any = {
        WHERE: {
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };
    const invalidQueryRooms: any = {
        WHERE: {},
        OPTIONS: {
            COLUMNS: [
                "rooms_title",
                "rooms_lat"
            ]
        }
    };
    let datasets: any = {};
    const cacheDir = __dirname + "/../data";
    const SERVER_URL = "http://localhost:4321";
    this.timeout(30000);
    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        try {
            server.start();
        } catch (error) {
            throw new InsightError("Error while starting server");
        }

        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        const dataDir = "../data";
        fs.removeSync(dataDir);
        fs.mkdirSync(dataDir);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }
        try {
            facade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        this.timeout(30000);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Sample on how to format PUT requests
    it("PUT valid test for courses dataset", function () {
        try {
            let id: string = "courses";
            let expected: any = {
                result: [id],
            };
            return chai.request(SERVER_URL)
                .put("/dataset/" + id + "/courses")
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("PUT: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("PUT invalid test for courses dataset", function () {
        try {
            let id: string = "coursesInvalidEmptyCourses";
            return chai.request(SERVER_URL)
                .put("/dataset/" + id + "/courses")
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID PUT: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("PUT valid test for rooms dataset", function () {
        try {
            let id1: string = "courses";
            let id2: string = "rooms";
            let expected: any = {
                result: [id1, id2],
            };
            return chai.request(SERVER_URL)
                .put("/dataset/" + id2 + "/rooms")
                .send(datasets[id2])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("PUT: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("PUT invalid test for rooms dataset", function () {
        try {
            let id: string = "roomsInvalidNoRooms";
            return chai.request(SERVER_URL)
                .put("/dataset/" + id + "/rooms")
                .send(datasets[id])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID PUT: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("POST valid test for courses query", function () {
        try {
            let query: any = validQueryCourses;
            let expected: any = facade.performQuery(JSON.parse(query));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("POST: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("POST invalid test for courses query", function () {
        try {
            let query: any = invalidQueryCourses;
            let expected: any = facade.performQuery(query);
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID POST: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("POST valid test for rooms query", function () {
        try {
            let query: any = validQueryRooms;
            let expected: any = facade.performQuery(JSON.parse(query));
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("POST: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("POST invalid test for rooms query", function () {
        try {
            let query: any = invalidQueryRooms;
            let expected: any = facade.performQuery(query);
            return chai.request(SERVER_URL)
                .post("/query")
                .send(query)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID POST: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("GET list for datasets", function () {
        try {
            const dataset1: InsightDataset = {
                id: "courses",
                kind: InsightDatasetKind.Courses,
                numRows: 64612
            };
            const dataset2: InsightDataset = {
                id: "rooms",
                kind: InsightDatasetKind.Rooms,
                numRows: 364
            };
            let expectedArr: InsightDataset[] = [dataset1, dataset2];
            let expected: any = {
                result: expectedArr,
            };
            return chai.request(SERVER_URL)
                .get("/datasets")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("GET: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("DELETE valid test for courses dataset", function () {
        try {
            let id: string = "courses";
            let expected: any = {
                result: id,
            };
            return chai.request(SERVER_URL)
                .del("/dataset/" + id)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("DELETE: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("DELETE invalid test for nonexistent dataset", function () {
        try {
            let id: string = "random";
            return chai.request(SERVER_URL)
                .del("/dataset/" + id)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID DELETE: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("DELETE invalid test for invalid dataset", function () {
        try {
            let id: string = " ";
            return chai.request(SERVER_URL)
                .del("/dataset/" + id)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("INVALID DELETE: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("GET list for datasets, now with 1 dataset", function () {
        try {
            const dataset1: InsightDataset = {
                id: "rooms",
                kind: InsightDatasetKind.Rooms,
                numRows: 364
            };
            let expectedArr: InsightDataset[] = [dataset1];
            let expected: any = {
                result: expectedArr,
            };
            return chai.request(SERVER_URL)
                .get("/datasets")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("GET: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    it("DELETE valid test for rooms dataset", function () {
        try {
            let id: string = "rooms";
            let expected: any = {
                result: id,
            };
            return chai.request(SERVER_URL)
                .del("/dataset/" + id)
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("DELETE: " + res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal(expected);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(err);
            // and some more logging here!
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
