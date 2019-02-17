const { GraphQLObjectType, GraphQLList, GraphQLString } = require("graphql");
const mongoose = require('mongoose');
// GraphQL Types
const VideoType = require("./videoType");
const BookType = require("./bookType");
// Mongoose model schemas
const Videos = mongoose.model("Videos");
const Books = mongoose.model("Books");

var queryType = new GraphQLObjectType({
    name: "Query",
    fields: {
        videos: {
            type: new GraphQLList(VideoType),
            args: {
                lang: { type: GraphQLString, defaultValue: "en" }
            },
            resolve: async (_, { lang }) => {
                return (await Videos.find()).map((video) => video.localize(lang));
            }
        },
        books: {
            type: new GraphQLList(BookType),
            args: {
                lang: { type: GraphQLString, defaultValue: "en" }
            },
            books: async (_, { lang }) => {
                return (await Books.find()).map((book) => book.localize(lang));
            }
        }
    }
});

module.exports = queryType;