const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async() => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, => {
            console.log("Server running At http://localhost:3000/");
        })
    }
    catch (e) {
        console.log(`DB Error ${e.message}`);
        process.exit(1);
    }
}

initializeDbAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
    return {
        stateId: dbObject.state_id,
        stateName: dbObject.state_name,
        population: dbObject.population,
    }
};


const convertDistObjectToResponseObject = (dbObject) => {
    return {
        districtId: dbObject.district_id,
        districtName: dbObject.district_name,
        stateId: dbObject.state_id,
        cases: dbObject.cases,
        cured: dbObject.cured,
        active:dbObject.active,
        deaths: dbObject.death,
    }
};

const convertReportObjectToResponseObject = (dbObject) => {
    return {
        totalCases: dbObject.cases,
        totalCured: dbObject.cured,
        totalActive: dbObject.active,
        totalDeaths: dbObject.deaths,
    }
};

app.get("/states/" , async (request,response) => {
    const getStatesQuery = `SELECT * FROM state
    ORDER BY state_id;`
    const statesArray = await db.all(getStatesQuery);
    response.send(statesArray.map(eachState) => {
    return     convertStateObjectToResponseObject(eachState);

    });
});


app.get("/states/:stateId/" , async(request,response) => {
    const { stateId } = request.params;
    const getStateQuery = `SELECT * from state
    WHERE state_id = ${stateId};`;
    const state = await db.get(getStateQuery);
    response.send(
        convertStateObjectToResponseObject(state)
    );

});

app.post("/districts/" , async(request,response) => {
    const { districtName, stateId, cases, cured, active, deaths } = request.body;

    const addDistQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES 
    (
        '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
   const addDistrict =  await db.run(addDistQuery);
   const districtId = addDistrict.lastId;
    response.send("District Successfully Added");


app.get("/districts/:districtId" , async(request,response) => {
    const { districtId } = request.params;
    const getDistQuery =`SELECT * FROM district WHERE district_id = ${districtId};`;
    const districtArray = await db.get(getDistQuery);
    response.send(convertDistObjectToResponseObject(districtArray));

});

app.delete("/districts/:districtId/" , async(request,response) => {
    const { districtId } = request.params;
    const deleteDistQuery = `DELETE FROM district
    WHERE district_id = ${districtId};`;
    await db.run(deleteDistQuery);
    response.send("District Removed");
});

app.put("districts/:districtId/" , async(request,response) => {
    const {districtName, stateId,cases,cured,active,deaths} = request.body;
    const { districtId } = request.params;
    const updateDistQuery = `UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};`;
    await db.run(updateDistQuery);
    response.send("District Details Updated");
});


app.get("/states/:stateId/stats/" , async (request,response) => {
    const {stateId} = request.params;
    const getStateReport = `SELECT SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) AS deaths,
    WHERE {state_id} = ${stateId};`;
    const getResult = await db.get(getStateReport);
    response.send(convertStateObjectToResponseObject(getResult));

});


app.get("/districts/:districtId/details/" , async(request,response) => {
    const {districtId} = request.params;
    const getStateDetails = `SELECT
    state_name  FROM state JOIN ON district
    state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
    const stateName = await.db.get(getStateDetails);
    response.send({stateName: stateName.state_name});
});

module.exports = app;


