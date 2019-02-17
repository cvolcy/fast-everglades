const { GraphQLObjectType, GraphQLString } = require("graphql");

var videoType = new GraphQLObjectType({
    name: "Video",
    fields: {
        _id: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        url: { type: GraphQLString },
    }
});

module.exports = videoType;