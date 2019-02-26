const { GraphQLSchema } = require("graphql");
const QueryType = require("./types/queryType");
const MutationType = require("./types/mutationType");

module.exports = new GraphQLSchema({ query: QueryType, mutation: MutationType });