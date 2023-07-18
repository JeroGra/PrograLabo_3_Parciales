"use strict";
const express = require('express');
const app = express();
app.set('puerto', 2023);
app.get('/', (request, response) => {
    response.send('GET - servidor NodeJS');
});
//AGREGO FILE SYSTEM
const fs = require('fs');
//AGREGO JSON
app.use(express.json());
//AGREGO JWT
const jwt = require("jsonwebtoken");
//SE ESTABLECE LA CLAVE SECRETA PARA EL TOKEN
app.set("key", "granadillo.jeronimo");
app.use(express.urlencoded({ extended: false }));
//AGREGO MULTER
const multer = require('multer');
//AGREGO MIME-TYPES
const mime = require('mime-types');
//AGREGO STORAGE
const storage = multer.diskStorage({
    destination: "public/juguetes/fotos/",
});
const upload = multer({
    storage: storage
});
//AGREGO CORS (por default aplica a http://localhost)
const cors = require("cors");
//AGREGO MW 
app.use(cors());
//DIRECTORIO DE ARCHIVOS ESTÁTICOS
app.use(express.static("public"));
//AGREGO MYSQL y EXPRESS-MYCONNECTION
const mysql = require('mysql');
const myconn = require('express-myconnection');
const db_options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'jugueteria_bd'
};
app.use(myconn(mysql, db_options, 'single'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// VERIFICAR JWT //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const verificar_jwt = express.Router();
verificar_jwt.use((request, response, next) => {
    //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
    let token = request.headers["x-access-token"] || request.headers["authorization"];
    if (!token) {
        response.status(401).send({
            error: "El JWT es requerido!!!"
        });
        return;
    }
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }
    if (token) {
        //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
        jwt.verify(token, app.get("key"), (error, decoded) => {
            if (error) {
                return response.status(403).json({
                    exito: false,
                    mensaje: "El JWT NO es válido!!!",
                    status: 403
                });
            }
            else {
                console.log("middleware verificar_jwt");
                //SE AGREGA EL TOKEN AL OBJETO DE LA RESPUESTA
                response.jwt = decoded;
                //SE INVOCA AL PRÓXIMO CALLEABLE
                next();
            }
        });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// SOLO ADMIN ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const solo_admin = express.Router();
solo_admin.use(verificar_jwt, (request, response, next) => {
    console.log("middleware solo_admin");
    //SE RECUPERA EL TOKEN DEL OBJETO DE LA RESPUESTA
    let usuario = response.jwt;
    if (usuario.perfil == "administrador") {
        //SE INVOCA AL PRÓXIMO CALLEABLE
        next();
    }
    else {
        return response.json({
            mensaje: "NO tiene perfil de 'ADMINISTRADOR'"
        });
    }
} /*, function (request:any, response:any, next:any) {
    console.log('Request Type:', request.method);
    next();
  }*/);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// RUTA VERIFICAR ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////// VERIFICAR TOKEN /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/login', verificar_jwt, (request, response) => {
    response.status(200).json({ exito: true, jwt: response.jwt });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////// VERIFICAR USUARIO /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const verificar_usuario = express.Router();
verificar_usuario.use((request, response, next) => {
    let obj = request.body;
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("select * from usuarios where clave = ? and correo = ? ", [obj.clave, obj.correo], (err, rows) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            if (rows.length == 1) {
                response.obj_usuario = rows[0];
                //SE INVOCA AL PRÓXIMO CALLEABLE
                next();
            }
            else {
                response.status(401).json({
                    exito: false,
                    mensaje: "Correo y/o clave incorrectos.",
                    jwt: null,
                });
            }
        });
    });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// LOGIN //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/login", verificar_usuario, (request, response, obj) => {
    //SE RECUPERA EL USUARIO DEL OBJETO DE LA RESPUESTA
    const user = response.obj_usuario;
    //SE CREA EL PAYLOAD CON LOS ATRIBUTOS QUE NECESITAMOS
    const payload = {
        usuario: {
            id: user.id,
            apellido: user.apellido,
            nombre: user.nombre,
            correo: user.rol,
            foto: user.foto,
            perfil: user.perfil,
            alumno: "Jeronimo_Granadillo",
            dni_alumno: 4248944
        },
        api: "jugueteria",
    };
    //SE FIRMA EL TOKEN CON EL PAYLOAD Y LA CLAVE SECRETA
    const token = jwt.sign(payload, app.get("key"), {
        expiresIn: "120s"
    });
    response.status(200).json({
        exito: true,
        mensaje: "JWT creado!!!",
        jwt: token,
    });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// CRUD PRODUCTOS //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LISTAR
app.get('/listarJuguetesBd', verificar_jwt, (request, response) => {
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("select * from juguetes", (err, rows) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            response.status(200).json({
                exito: true,
                dato: JSON.stringify(rows)
            });
        });
    });
});
//AGREGAR
app.post('/agregarJugueteBd', verificar_jwt, upload.single("foto"), (request, response) => {
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.juguete_json);
    let path = file.destination + obj.marca + "." + extension;
    fs.renameSync(file.path, path);
    obj.path_foto = path.split("public/")[1];
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("insert into juguetes set ?", [obj], (err, rows) => {
            if (err) {
                console.log(err);
                throw ("Error en consulta de base de datos.");
            }
            response.status(200).json({
                exito: true,
                mensaje: "Juguete agregado!"
            });
            ;
        });
    });
});
//MODIFICAR
app.post('/toys', verificar_jwt, upload.single("foto"), (request, response) => {
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.juguete);
    let path = file.destination + obj.marca + "." + extension;
    fs.renameSync(file.path, path);
    obj.path_foto = path.split("public/")[1];
    let obj_modif = {};
    //para excluir la pk (codigo)
    obj_modif.marca = obj.marca;
    obj_modif.precio = obj.precio;
    obj_modif.path_foto = obj.path_foto;
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("update juguetes set ? where id = ?", [obj_modif, obj.id_juguete], (err, rows) => {
            if (err) {
                console.log(err);
                throw ("Error en consulta de base de datos.");
            }
            response.status(200).json({
                exito: true,
                mensaje: "Juguete modificado"
            });
        });
    });
});
//ELIMINAR
app.delete('/toys', verificar_jwt, (request, response) => {
    let obj = request.body;
    let path_foto = "public/";
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        //obtengo el path de la foto del producto a ser eliminado
        conn.query("select path from juguetes where id = ?", [obj.id_juguete], (err, result) => {
            if (err)
                throw ("Error en consulta de base de datos.");
            //console.log(result[0].path);
            path_foto += result[0].path;
        });
    });
    request.getConnection((err, conn) => {
        if (err)
            throw ("Error al conectarse a la base de datos.");
        conn.query("delete from juguetes where id = ?", [obj.id_juguete], (err, rows) => {
            if (err) {
                console.log(err);
                throw ("Error en consulta de base de datos.");
            }
            fs.unlink(path_foto, (err) => {
                if (err)
                    throw err;
                console.log(path_foto + ' fue borrado.');
            });
            response.status(200).json({
                exito: true,
                mensaje: "objeto id_juguete " + obj.id_juguete + " fue eliminado"
            });
        });
    });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// IMPORTANTE ///
app.listen(app.get('puerto'), () => {
    console.log('Servidor corriendo sobre puerto:', app.get('puerto'));
});
//# sourceMappingURL=server_node.js.map