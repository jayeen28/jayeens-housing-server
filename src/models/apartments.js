const { Schema, model } = require('mongoose')

const apartmentSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    imageURLs: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        required: true
    },
    sqft: {
        type: Number,
        required: true
    },
    beds: {
        type: Number,
        required: true
    },
    baths: {
        type: Number,
        required: true
    }
});

const Apartment = model('Aprtment', apartmentSchema);
module.exports = Apartment;