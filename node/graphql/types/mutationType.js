const { GraphQLObjectType, GraphQLString, GraphQLNonNull } = require("graphql");
const mongoose = require('mongoose');
// GraphQL Types
const VideoType = require("./videoType");
const VideoInputType = require("../inputs/videoInput");
// Mongoose model schemas
const Videos = mongoose.model("Videos");

var queryType = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        updateVideo: {
            type: VideoType,
            args: {
                lang: { type: new GraphQLNonNull(GraphQLString) },
                input: { type: new GraphQLNonNull(VideoInputType) }
            },
            resolve: async (_, { lang, input }) => {
                const _id = input._id;
                let updates = {};
        
                if (input['title']) updates[`${lang}.title`] = input.title;
                if (input['description']) updates[`${lang}.description`] = input.description;
                if (input['url']) updates[`${lang}.url`] = input.url;
        
                return (await Videos.findOneAndUpdate({ _id }, { $set: updates}, {new: true}))
                            .localize(lang);
            }
        }
    }
});

module.exports = queryType;