/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = "http://localhost:4321/query";
        xhr.open("POST", url, true);
        xhr.onload = function () {
            let response = JSON.parse(xhr.responseText);
            resolve(response);
        };
        xhr.addEventListener("error", (err) => {
            reject(error);
        });
        return xhr.send(JSON.stringify(query));
    });
};
