const sql = require('mssql')
const waldmannConfig = require('./config.js')

const config = {
    user: waldmannConfig.DB.user,
    password: waldmannConfig.DB.password,
    server: waldmannConfig.DB.server,
    database: waldmannConfig.DB.database,
}


async function executeQuery(aQuery){
    var connection = await sql.connect(config)
    var result = await connection.query(aQuery)

    return result.recordset
}

module.exports = {executeQuery: executeQuery}
