import ParseIndex from "./ParseIndex";

export default class ParseHTML {
    // retrieve building from index --> getCode, address, fullname, lat, lon
    // roomNumber, seats, furniture, type, href --> []
    // for i of array, convert to object for room

    public parseHTML(buildings: any[], file: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let tableChild: any[] = ParseHTML.getTable(file);
            if (tableChild === null || tableChild === undefined || tableChild.length === 0) {
                return resolve(null);
            }
            let dataObject: object;
            let res: any = {};
            let buildingFull: string = ParseHTML.getBuildingName(file); // get fullname
            let buildingInfo: any[] = ParseHTML.retrieveBuilding(buildings, buildingFull);
            let roomNumbers: string[] = [];
            let roomSeats: number[] = [];
            let roomTypes: string[] = [];
            let roomFurniture: string[] = [];
            let roomHref: string[] = [];
            for (let child of tableChild) {
                if (child.nodeName !== "#text") {
                    let n: string = ParseHTML.getRoomNumber(child);
                    let t: string = ParseHTML.getType(child);
                    let f: string = ParseHTML.getFurniture(child);
                    let h: string = ParseHTML.getHRef(child);
                    if (n !== null && t !== null && f !== null && h !== null) {
                        roomNumbers.push(n);
                        roomSeats.push(ParseHTML.getSeat(child));
                        roomTypes.push(t);
                        roomFurniture.push(f);
                        roomHref.push(h);
                    }
                }
            }
            for (let i in roomNumbers) {
                dataObject = {
                    fullname: buildingFull,
                    shortname: buildingInfo[0],
                    number: roomNumbers[i],
                    name: buildingInfo[0] + "_" + roomNumbers[i],
                    address: buildingInfo[2],
                    lat: Number(buildingInfo[3]),
                    lon: Number(buildingInfo[4]),
                    seats: Number(roomSeats[i]),
                    type: roomTypes[i],
                    furniture: roomFurniture[i],
                    href: roomHref[i]
                };
                res[i] = dataObject;
            }
            return resolve(res);
        });
    }

    private static getTable(element: any): any[] {
        if  (element.nodeName === "table" && ParseIndex.validTableAttribute(element.attrs)) {
            for (let child of element.childNodes) {
                if (child.nodeName === "tbody" && child.childNodes) {
                    return child.childNodes;
                }
            }
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

    // fullname retrieval
    public static getBuildingName(element: any): string {
        if (element.nodeName === "span" && this.validBuildingAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleName = this.getBuildingName(child);
                if (possibleName !== "") {
                    return possibleName;
                }
            }
        }
        return "";
    }

    private static validBuildingAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "field-content") {
                return true;
            }
        }
        return false;
    }

    private static getRoomNumber(element: any): string {
        if (element.nodeName === "a" && this.validRoomNumberAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleRoomNumber = this.getRoomNumber(child);
                if (possibleRoomNumber !== null) {
                    return possibleRoomNumber;
                }
            }
        }
        return null;
    }

    private static validRoomNumberAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "title" && a.value === "Room Details") {
                return true;
            }
        }
        return false;
    }

    private static getSeat(element: any): number {
        if (element.nodeName === "td" && this.validSeatAttribute(element.attrs)) {
            return Number(String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", ""));
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleSeats = this.getSeat(child);
                if (possibleSeats !== 0) {
                    return possibleSeats;
                }
            }
        }
        return 0;
    }

    private static validSeatAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-field views-field-field-room-capacity") {
                return true;
            }
        }
        return false;
    }

    private static getFurniture(element: any): string {
        if (element.nodeName === "td" && this.validFurnitureAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleFurniture = this.getFurniture(child);
                if (possibleFurniture !== null) {
                    return possibleFurniture;
                }
            }
        }
        return null;
    }

    private static validFurnitureAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-field views-field-field-room-furniture") {
                return true;
            }
        }
        return false;
    }

    private static getType(element: any): string {
        if (element.nodeName === "td" && this.validTypeAttribute(element.attrs)) {
            return String(element.childNodes[0].value).trim().replace("/\\r?\\n|\\r/g", "");
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleCode = this.getType(child);
                if (possibleCode !== null) {
                    return possibleCode;
                }
            }
        }
        return null;
    }

    private static validTypeAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "class" && a.value === "views-field views-field-field-room-type") {
                return true;
            }
        }
        return false;
    }

    private static getHRef(element: any): string {
        if (element.nodeName === "a" && this.validHRefAttribute(element.attrs)) {
            return this.hRefHelper(element.attrs);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleHRef = this.getHRef(child);
                if (possibleHRef !== null) {
                    return possibleHRef;
                }
            }
        }
        return null;
    }

    private static validHRefAttribute(attribute: any[]): boolean {
        for (let a of attribute) {
            if (a.name === "href" &&
                a.value.startsWith("http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/")) {
                return true;
            }
        }
        return false;
    }

    private static hRefHelper(attrs: any[]): string {
        for (let a of attrs) {
            if (a.name === "href" &&
                a.value.startsWith("http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/")) {
                return String(a.value);
            }
        }
        return "";
    }

    private static retrieveBuilding(index: any, name: string): any[] {
        for (let arr of index) {
            if (arr[1] === name) {
                return arr;
            }
        }
        return [];
    }
}
