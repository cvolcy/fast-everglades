const mongoose = require('mongoose');

let dataSchema = {
    title: String,
    description: String,
    url: String
};

let videosSchema = new mongoose.Schema({
    en: dataSchema,
    fr: dataSchema
}, { timestamps: true });

videosSchema.methods.localize = function(locale) {
    let locales = ['fr', 'en'];
    locales.push(locales.splice(locales.indexOf(locale), 1)[0]);
    
    let data = {_id: this._doc._id.toString()};
    
    for (let i = 0; i < locales.length; i++) {
        data = {...data, ...this._doc[locales[i]]}
    };
    
    return data;
};

mongoose.model('Videos', videosSchema);