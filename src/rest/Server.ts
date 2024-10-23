/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static facade: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");
                Server.facade = new InsightFacade();
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", that.putRequest);
                that.rest.del("/dataset/:id", that.deleteRequest);
                that.rest.post("/query", that.postRequest);
                that.rest.get("/datasets", that.getRequest);

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    // that.rest.put("/dataset/:id/:kind", that.putRequest);
    private putRequest(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RoutHandler::putRequest::"  + req.url);
        try {
            let id: string = req.params.id;
            let content: any = req.body;
            let base64Content = Buffer.from(content).toString("base64");
            let kind: InsightDatasetKind;
            if (req.params.kind === "courses") {
                kind = InsightDatasetKind.Courses;
            } else if (req.params.kind === "rooms") {
                kind = InsightDatasetKind.Rooms;
            } else {
                throw new InsightError("Invalid dataset kind");
            }
            Server.facade.addDataset(id, base64Content, kind).then(function (arr) {
                res.json(200, {result: arr});
                return next();
            }).catch(function (err) {
                res.json(400, {error: err.message});
                return next();
            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    }

    private postRequest(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RoutHandler::postRequest::"  + req.url);
        try {
            let query: any = req.getQuery;
            Server.facade.performQuery(query).then(function (arr) {
                res.json(200, {result: arr});
                return next();
            }).catch(function (err) {
                res.json(400, {error: err.message});
                return next();
            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    }

    // that.rest.del("/dataset/:id", that.deleteRequest);
    private deleteRequest(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RoutHandler::deleteRequest::"  + req.url);
        try {
            let id: string = req.params.id;
            Server.facade.removeDataset(id).then(function (str) {
                res.json(200, {result: str});
                return next();
            }).catch(function (err) {
                if (err instanceof InsightError) {
                    res.json(400, {error: err.message});
                    return next();
                } else if (err instanceof NotFoundError) {
                    res.json(404, {error: err.message});
                    return next();
                }
            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    }

    private getRequest(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("RoutHandler::getRequest::"  + req.url);
        try {
            Server.facade.listDatasets().then(function (response) {
                res.json(200, {result: response});
                return next();
            });
        } catch (error) {
            res.json(400, {error: error.message});
            return next();
        }
    }

}
