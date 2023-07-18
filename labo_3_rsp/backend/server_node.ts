import { json } from "node:stream/consumers";

const express = require('express');

const app = express();

app.set('puerto', 7723);

app.get('/', (request:any, response:any)=>{
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

app.use(express.urlencoded({extended:false}));

//AGREGO MULTER
const multer = require('multer');

//AGREGO MIME-TYPES
const mime = require('mime-types');

//AGREGO STORAGE
const storage = multer.diskStorage({

    destination: "public/articulos/fotos/",
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
    database: 'bazar_bd'
};

app.use(myconn(mysql, db_options, 'single'));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// VERIFICAR JWT //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const verificar_jwt = express.Router();

verificar_jwt.use((request:any, response:any, next:any)=>{

    //SE RECUPERA EL TOKEN DEL ENCABEZADO DE LA PETICIÓN
    let token = request.headers["x-access-token"] || request.headers["authorization"];
    
    if (! token) {
        response.status(401).send({
            error: "El JWT es requerido!!!"
        });
        return;
    }

    if(token.startsWith("Bearer ")){
        token = token.slice(7, token.length);
    }

    if(token){
        //SE VERIFICA EL TOKEN CON LA CLAVE SECRETA
        jwt.verify(token, app.get("key"), (error:any, decoded:any)=>{

            if(error){
                return response.json({
                    exito: false,
                    mensaje:"El JWT NO es válido!!!",
                    status : 403
                });
            }
            else{

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

solo_admin.use(verificar_jwt, (request:any, response:any, next:any)=>{

    console.log("middleware solo_admin");

    //SE RECUPERA EL TOKEN DEL OBJETO DE LA RESPUESTA
    let usuario = response.jwt;

    if(usuario.perfil == "administrador"){
        //SE INVOCA AL PRÓXIMO CALLEABLE
         next();
    }
    else{
        return response.json({
            mensaje:"NO tiene perfil de 'ADMINISTRADOR'"
        });
    }
   
}/*, function (request:any, response:any, next:any) {
    console.log('Request Type:', request.method);
    next();
  }*/);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// RUTA VERIFICAR ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/admin', solo_admin, (request:any, response:any)=>{
    
    response.json(response.jwt);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////// VERIFICAR TOKEN /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/login', verificar_jwt, (request:any, response:any)=>{
    
    response.status(200).json({exito:true, jwt: response.jwt});
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////// VERIFICAR USUARIO /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const verificar_usuario = express.Router();

verificar_usuario.use((request:any, response:any, next:any)=>{

    let obj = request.body;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from usuarios where clave = ? and correo = ? ", [obj.clave, obj.correo], (err:any, rows:any)=>{

            if(err) throw("Error en consulta de base de datos.");

            if(rows.length == 1){

                response.obj_usuario = rows[0];
                //SE INVOCA AL PRÓXIMO CALLEABLE
                next();
            }
            else{
                response.status(401).json({
                    exito : false,
                    mensaje : "Correo y/o clave incorrectos.",
                    jwt : null,
                });
            }
           
        });
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// LOGIN //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/login", verificar_usuario, (request:any, response:any, obj:any)=>{

    //SE RECUPERA EL USUARIO DEL OBJETO DE LA RESPUESTA
    const user = response.obj_usuario;

    //SE CREA EL PAYLOAD CON LOS ATRIBUTOS QUE NECESITAMOS
    const payload = { 
        usuario: {
            id : user.id,
            apellido : user.apellido,
            nombre : user.nombre,
            correo : user.rol,
            foto: user.foto,
            id_perfil: user.id_perfil,
            alumno: "Jeronimo_Granadillo",
            dni_alumno: 4248944
        },
        api : "bazar",
    };

    //SE FIRMA EL TOKEN CON EL PAYLOAD Y LA CLAVE SECRETA
    const token = jwt.sign(payload, app.get("key"), {
        expiresIn : "180s"
    });

    response.status(200).json({
        exito : true,
        mensaje : "JWT creado!!!",
        jwt : token,
    });

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// CRUD  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LISTAR
app.get('/listarArticulosBD',verificar_jwt, (request:any, response:any)=>{

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("select * from articulos", (err:any, rows:any)=>{

            if(err) throw("Error en consulta de base de datos.");

            response.status(200).json({
                exito : true,
                dato : JSON.stringify(rows)
            });
        });
    });

});

//AGREGAR
app.post('/agregarArticuloBD',verificar_jwt, upload.single("foto"), (request:any, response:any)=>{
   
    let file = request.file;
    let extension = mime.extension(file.mimetype);

    let obj = JSON.parse(request.body.articulo_json);

    let path : string = file.destination + obj.tipo + "." + extension;

    fs.renameSync(file.path, path);

    obj.path_foto = path.split("public/")[1];

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("insert into articulos set ?", [obj], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            response.status(200).json({
                exito : true,
                mensaje : "Articulo agregado!"
            });;
        });
    });
});
//MODIFICAR
app.post('/artis', verificar_jwt, upload.single("foto"), (request:any, response:any)=>{
    
    let file = request.file;
    let extension = mime.extension(file.mimetype);
    let obj = JSON.parse(request.body.articulo);
    let path : string = file.destination + obj.tipo +"_modificacion"+ "." + extension;

    fs.renameSync(file.path, path);

    obj.path_foto = path.split("public/")[1];

    let obj_modif : any = {};
    //para excluir la pk (codigo)
    obj_modif.tipo = obj.tipo;
    obj_modif.precio = obj.precio;
    obj_modif.path_foto = obj.path_foto;

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("update articulos set ? where id = ?", [obj_modif, obj.id_articulo], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            response.status(200).json({
                exito : true,
                mensaje : "Articulo modificado"
            });
        });
    });
});
//ELIMINAR
app.delete('/artis', verificar_jwt, (request:any, response:any)=>{
   
    let obj = request.body;
    let path_foto : string = "public/";

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        //obtengo el path de la foto del producto a ser eliminado
        conn.query("select path_foto from articulos where id = ?", [obj.id_articulo], (err:any, result:any)=>{

            if(err) throw("Error en consulta de base de datos.");
            //console.log(result[0].path);
            path_foto += result[0].path_foto;
        });
    });

    request.getConnection((err:any, conn:any)=>{

        if(err) throw("Error al conectarse a la base de datos.");

        conn.query("delete from articulos where id = ?", [obj.id_articulo], (err:any, rows:any)=>{

            if(err) {console.log(err); throw("Error en consulta de base de datos.");}

            fs.unlink(path_foto, (err:any) => {
                if (err) throw err;
                console.log(path_foto + ' fue borrado.');
            });

            response.status(200).json({
                exito : true,
                mensaje : "Articulo id "+obj.id_articulo+" fue eliminado"
            });
        });
    });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// IMPORTANTE ///
app.listen(app.get('puerto'), ()=>{
    console.log('Servidor corriendo sobre puerto:', app.get('puerto'));
});