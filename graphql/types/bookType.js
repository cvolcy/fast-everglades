const { GraphQLObjectType, GraphQLString } = require("graphql");

var bookType = new GraphQLObjectType({
    name: "Book",
    fields: {
        _id: { type: GraphQLString },
        title: { type: GraphQLString },
    }
});

module.exports = bookType;