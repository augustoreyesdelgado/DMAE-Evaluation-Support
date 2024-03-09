const fs = require('fs');

async function clasifica(data){
    const response = await fetch(
        "https://api-inference.huggingface.co/models/Augusto777/vit-base-patch16-224-dmae-va-U",
        {
            headers: { Authorization: "Bearer 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" },
            method: "POST",
            body: data,
        }
    );
    return response;
}

module.exports = {
    clasifica
}