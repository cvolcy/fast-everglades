const { graphql } = require("graphql");
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection
    .on('error', (error) => { console.warn('Warning', error); });

// Load Mongoose models
require('./models/models.js');

const schema = require("./schema.js");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let query = null;
    if (req.query.query || (req.body && req.body.query)) {
        query = req.query.query || req.body.query;
    } else {
        context.res = {
            status: 400,
            body: "Please pass a query parameter on the query string or in the request body"
        };

        return;
    }

    let variables = null;
    if (req.query.variables || (req.body && req.body.variables)) {
        variables = JSON.parse(req.query.variables || req.body.variables);
    }

    let response = await graphql(schema, query, null, null, variables);
    
    context.res = {
        headers:  {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: response.data}, null, 3)
    };
};