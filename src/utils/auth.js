const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            res.render('login',{
                alert: true,
                alertTitle: "Error",
                alertMessage: "Se Requiere Iniciar Sesión",
                alertIcon: 'error',
                showConfirmButton: false,
                time: 2000,
                ruta: ''
                });
        }
        try{
            req.userId = decoded.id;
            next();}catch(e){
                return e
            }
    });
};

module.exports = authenticateToken;
