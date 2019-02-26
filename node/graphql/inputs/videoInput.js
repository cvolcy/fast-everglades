const { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } = require("graphql");

var videoInputType = new GraphQLInputObjectType({
    name: "VideoInput",
    fields: {
        _id: { type: new GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        url: { type: GraphQLString },
    }
});

module.exports = videoInputType;