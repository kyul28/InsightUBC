/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    let datasetName;
    let dataIndex;
    // Setting body: "WHERE"
    query.WHERE = {};
    if (document.getElementsByClassName("nav-item tab active")[0].getAttribute("data-type") === "courses") {
        datasetName = "courses";
        dataIndex = 0;
    } else {
        datasetName = "rooms";
        dataIndex = 1
    }
    let body = query["WHERE"]
    let bodyElem;
    // The case where "AND" or "OR" is selected, but there is only one filter filled out
    if (document.getElementsByClassName("conditions-container")[dataIndex].childElementCount === 1 &&
        !document.getElementById(datasetName+"-conditiontype-none").hasAttribute("checked")) {
        let elem = document.getElementsByClassName("conditions-container")[dataIndex].firstElementChild;
        addFilter(body, elem, datasetName);
    } else if(document.getElementsByClassName("conditions-container")[dataIndex].childElementCount === 1) {
        let elem = document.getElementsByClassName("conditions-container")[dataIndex].firstElementChild;
        body["NOT"] = {};
        bodyElem = body.NOT;
        addFilter(bodyElem, elem, datasetName);
    } else if (document.getElementsByClassName("conditions-container")[dataIndex].childElementCount !== 0){
        if (document.getElementById(datasetName+"-conditiontype-all").hasAttribute("checked")) {
            bodyElem = addLogicComp(body, "AND");
        } else if (document.getElementById(datasetName+"-conditiontype-any").hasAttribute("checked")) {
            bodyElem = addLogicComp(body, "OR");
        } else {
            bodyElem = addNotComp(body);
        }
        document.getElementsByClassName("conditions-container")[dataIndex].childNodes.forEach((value) => {
            if (value.getElementsByClassName("control not")[0].firstElementChild.hasAttribute("checked")) {
                addNotFilter(bodyElem, value, datasetName);
            } else {
                addFilter(bodyElem, value, datasetName);
            }
        })
    }

    // setting "OPTIONS": COLUMNS
    query["OPTIONS"] = {};
    let opt = query.OPTIONS;
    opt["COLUMNS"] = [];
    let columns = opt.COLUMNS;
    let colForm = document.getElementsByClassName("form-group columns")[dataIndex].getElementsByClassName("control-group")[0].children
    for (let elem of colForm) {
        if (elem.className === "control field") {
            if (elem.firstElementChild.hasAttribute("checked")) {
                let key = elem.firstElementChild.getAttribute("data-key");
                columns.push(datasetName + "_" + key);
            }
        } else if (elem.className === "control transformation") {
            if (elem.firstElementChild.hasAttribute("checked")) {
                let key = elem.firstElementChild.getAttribute("data-key");
                columns.push(key);
            }
        }
    }
    // setting "OPTIONS": ORDER
    let checkOrder = document.getElementsByClassName("form-group order")[dataIndex].getElementsByClassName("control-group")[0];
    if (orderIsObj(checkOrder)) {
        opt["ORDER"] = {};
        let order = opt.ORDER;
        if (dataIndex === 0) {
            if (document.getElementById("courses-order").hasAttribute("checked")) {
                order["dir"] = "DOWN";
            } else {
                order["dir"] = "UP";
            }
        } else if (dataIndex === 1) {
            if (document.getElementById("rooms-order").hasAttribute("checked")) {
                order["dir"] = "DOWN";
            } else {
                order["dir"] = "UP";
            }
        }
        let orderList = document.getElementsByClassName("control order fields")[dataIndex].children[0].children;
        order["keys"] = [];
        for (let elem of orderList) {
            if (elem.hasAttribute("selected") && elem.className === "transformation") {
                order.keys.push(elem.value);
            } else if (elem.hasAttribute("selected")) {
                order.keys.push(datasetName + "_" + elem.value);
            }
        }
    } else {
        opt["ORDER"] = "";
        let orderList = document.getElementsByClassName("control order fields")[dataIndex].children[0].children;
        for (let elem of orderList) {
            if (elem.hasAttribute("selected") && elem.className === "transformation") {
                opt["ORDER"] = elem.value;
            } else if (elem.hasAttribute("selected")) {
                opt["ORDER"] = datasetName + "_" + elem.value;
            }
        }
    }
    // setting "TRANSFORMATIONS": GROUP
    let groupList = document.getElementsByClassName("form-group groups")[dataIndex]
        .getElementsByClassName("control-group")[0].children;
    let applyList = document.getElementsByClassName("form-group transformations")[dataIndex]
        .getElementsByClassName("transformations-container")[0].children;
    if (hasTransformations(groupList, applyList)) {
        query["TRANSFORMATIONS"] = {};
        let trans = query.TRANSFORMATIONS;
        trans["GROUP"] = [];
        let group = trans.GROUP;
        for (let elem of groupList) {
            if (elem.firstElementChild.hasAttribute("checked")) {
                let groupKey = datasetName + "_" + elem.firstElementChild.value;
                group.push(groupKey);
            }
        }
        // setting "TRANSFORMATIONS": APPLY
        trans["APPLY"] = [];
        let apply = trans.APPLY;
        for (let elem of applyList) {
            addApplyRule(apply, elem, datasetName);
        }
    }
    return query;
};

function addLogicComp(query, filter) {
    query[filter] = [];
    return query[filter];
}

function addNotComp(query) {
    query["NOT"] = {};
    query.NOT["OR"] = [];
    return query.NOT.OR;
}

function addNotFilter(query, elem, dataset) {
    let query1 = {}
    query1["NOT"] = {};
    let not = query1.NOT;
    addFilter(not, elem, dataset);
    query.push(query1);
}
function addFilter(query, elem, dataset) {
    let tKey;
    let arr = elem.getElementsByClassName("control fields")[0].children[0].getElementsByTagName("option");
    for (let e of arr) {
        if (e.hasAttribute("selected")) {
            tKey = e.getAttribute("value");
        }
    }
    let filter;
    arr = elem.getElementsByClassName("control operators")[0].children[0].getElementsByTagName("option");
    for (let e of arr) {
        if (e.hasAttribute("selected")) {
            filter = e.value;
        }
    }
    let input = elem.getElementsByClassName("control term")[0];
    let value = input.firstElementChild.value;
    if (filter === 'GT' || filter === 'LT' || filter === 'EQ') {
        if (!isNaN(Number(value))) {
            value = Number(value);
        }
    }
    if (Array.isArray(query)){
        query.push({[filter]: { [dataset + "_" + tKey]: value}});
    } else {
        query[filter] = { [dataset + "_" + tKey]: value};
    }
}

function orderIsObj(order) {
    let dir = order.getElementsByClassName("control descending")[0];
    if (dir.getElementsByTagName("input")[0].hasAttribute("checked")) {
        return true;
    } else {
        let selectCount = 0;
        let orderList = document.getElementsByClassName("control order fields")[0].children[0].children;
        for (let elem of orderList) {
            if (elem.hasAttribute("selected")) {
                selectCount++;
            }
        }
        return selectCount > 1;
    }
}

function hasTransformations(group, apply) {
    for (let elem of group) {
        if (elem.firstElementChild.hasAttribute("checked")) {
            return true;
        }
    }
    return apply.length > 0;
}

function addApplyRule(query, elem, dataset) {
    let aKey = elem.getElementsByClassName("control term")[0].firstElementChild.value;
    let aToken;
    let arr = elem.getElementsByClassName("control operators")[0].children[0].getElementsByTagName("option");
    for (let token of arr) {
        if (token.hasAttribute("selected")) {
            aToken = token.value;
        }
    }
    let key;
    arr = elem.getElementsByClassName("control fields")[0].children[0].getElementsByTagName("option");
    for (let e of arr) {
        if (e.hasAttribute("selected")) {
            key = dataset + "_" + e.value;
        }
    }
    query.push({[aKey]: { [aToken]: key}});
}
