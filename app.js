const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
let db = null;
let dbPath = path.join(__dirname, "covid19India.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//get all states
app.get("/states/", async (request, response) => {
  const allStatesQuery = `
    SELECT 
    *
    FROM
    state;`;
  const allStatesArray = await db.all(allStatesQuery);
  const getAllDetails = (eachArray) => {
    return {
      stateId: eachArray.state_id,
      stateName: eachArray.state_name,
      population: eachArray.population,
    };
  };
  response.send(allStatesArray.map((eachArray) => getAllDetails(eachArray)));
});

//get a state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT 
  * 
  FROM
  state
  WHERE 
  state_id = ${stateId};`;
  const getState = await db.get(getStateQuery);
  const getStateDetails = (State) => {
    return {
      stateId: State.state_id,
      stateName: State.state_name,
      population: State.population,
    };
  };
  response.send(getStateDetails(getState));
});

//create a District
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES 
  ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//get a district based on district id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT 
  *
  FROM 
  district
  WHERE
  district_id = ${districtId};`;
  const dbDistrict = await db.get(getDistrictQuery);
  const getDistrictCamel = (district) => {
    return {
      districtId: district.district_id,
      districtName: district.district_name,
      stateId: district.state_id,
      cases: district.cases,
      cured: district.cured,
      active: district.active,
      deaths: district.deaths,
    };
  };
  response.send(getDistrictCamel(dbDistrict));
});

//delete a district based on district id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
  DELETE FROM
  district
  WHERE
  district_id = ${districtId}`;
  const dbDelete = await db.run(deleteQuery);
  response.send("District Removed");
});

//update a district based on district id
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtBody;
  const updateDistrictQuery = `
  UPDATE
  district
  SET
  district_name='${districtName}',
  state_id= ${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
  SELECT
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths
  FROM 
  district
  WHERE
  state_id = ${stateId};`;
  const statistics = await db.get(getStatisticsQuery);
  response.send(statistics);
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
  SELECT
  state_id
  FROM 
  district 
  WHERE
  district_id = ${districtId};`;
  const gotStateId = await db.get(getStateIdQuery);

  const getStateNameQuery = ` 
  SELECT 
  state_name AS stateName
  FROM 
  state
  WHERE
  state_id =${gotStateId.state_id};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});
module.exports = app;
