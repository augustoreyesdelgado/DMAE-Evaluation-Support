const fs = require('fs');
require('dotenv').config({path:'./env/.env'});

async function clasifica(data){
    const response = await fetch(
        "https://api-inference.huggingface.co/models/Augusto777/vit-base-patch16-224-U8-10b",
        {
            headers: { Authorization: process.env.API_KEY },
            method: "POST",
            body: data,
        }
    );
    return response;
}

module.exports = {
    clasifica
}