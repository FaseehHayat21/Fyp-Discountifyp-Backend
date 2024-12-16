const mongoose = require('mongoose');
const { Schema } = mongoose;

const DefaultItemSchema = new Schema({
    // inventoryItem:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'inventoryItem'
    // },
    partNumber:{
        type: String,
        required: true,     
    },
    itemName:{
        type: String,
        required: true
    }, 
    serialNumber:{
        type: String,
        required: true, 
    },
    dateOfArrival:{
        type: String,
        required: true, 
    },      
    remarks:{
        type: String,

    },      
    location:{
        type: String,
        required: true, 
    },      
    tag:{
        type: String,
        default: "N/A"
    },
    quantity:{
        type: Number,
       
    },
    ERRC:{
        type: String,
    },
    dateOfDefault:{
        type: String,
        required: true,
    },
    // imageUrl: { 
    //     type: String,   
    // },
    date:{
        type: Date,
        default: Date.now
    },
    }
  );

  module.exports = mongoose.model('defaultItem', DefaultItemSchema);