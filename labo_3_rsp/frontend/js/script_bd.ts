$(()=>{

    VerificarJWT();
    AdministrarListar();
    AdministrarAltaArticulo();
});


function VerificarJWT() {
    
    //RECUPERO DEL LOCALSTORAGE
    let jwt = localStorage.getItem("jwt");

    $.ajax({
        type: 'GET',
        url: URL_API + "login",
        dataType: "json",
        data: {},
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (obj_rta:any) {

        console.log(obj_rta);

        if(obj_rta.exito){

            let app = obj_rta.jwt.api;
            let usuario = obj_rta.jwt.usuario;

            let alerta:string = ArmarAlert(app + "<br>" + JSON.stringify(usuario));

            $("#divTablaIzq").html(alerta).toggle(2000);
            $("#rol").html(usuario.nombre);
            $("#nombre_usuario").html(usuario.nombre);
        }
        else{
            let alerta:string = ArmarAlert(obj_rta.mensaje, "danger");

            $("#divTablaIzq").html(alerta).toggle(2000);

            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1500);
        }
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {

        let retorno = JSON.parse(jqXHR.responseText);

        let alerta:string = ArmarAlert(retorno.mensaje, "danger");

        $("#divTablaIzq").html(alerta).show(2000);
    });    
}

function AdministrarAltaArticulo() {
    
    $("#alta_articulo").on("click", ()=>{

        let form = `<div class="row">
        <div class="offset-4 col-8 text-info">
            <h2 style="color: rgb(7, 28, 151);">
                ARTÍCULOS
            </h2>
        </div>
    </div>

    <div class="row">

        <div class="offset-4 col-3">

            <div class="form-bottom" style="background-color: rgb(175, 11, 197);">

                <form role="form" action="" method="" class="">
                    <br>
                    <div class="form-group">                                  
                        <div class="input-group m-2">
                            <div class="input-group-prepend">
                                <span class="input-group-text fas fa-trademark"></span> 
                                <input type="text" class="form-control" name="tipo" id="txtTipo" style="width:248px;" placeholder="Tipo" />
                            </div>
                        </div>
                    </div>

                    <div class="form-group">    
                        <div class="input-group m-2">
                            <div class="input-group-prepend">
                                <span class="input-group-text fas fa-dollar-sign"></span> 
                                <input type="text" class="form-control" name="precio" id="txtPrecio" style="width:250px;" placeholder="Precio" />
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="input-group m-2">
                            <div class="input-group-prepend">
                                <span class="input-group-text fas fa-camera"></span> 
                                <input type="file" class="form-control" name="foto" id="txtFoto" style="width:250px;" placeholder="Foto" />
                            </div>
                        </div>
                    </div>

                    <div class="row m-2">
                        <div class="col-6">
                            <button type="button" class="btn btn-success btn-block" id="btnEnviar" onclick="Agregar()">Agregar</button>
                        </div>
                        <div class="col-6">
                            <button type="reset" class="btn btn-warning btn-block" id="btnEnviar">Limpiar</button>
                        </div>
                    </div>

                    <br>
                </form>


            </div>

        </div>

    </div>`


    $("#divTablaDer").html(form).show(1000);

    });
}
function AdministrarListar() {

    $("#listado_articulos").on("click", ()=>{
        ObtenerListadoArticulos();
    });
}

function ObtenerListadoArticulos() {
   
    $("#divTablaIzq").html("");

    let jwt = localStorage.getItem("jwt");

    $.ajax({
        type: 'GET',
        url: URL_API + "listarArticulosBD",
        dataType: "json",
        data: {},
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (resultado:any) {

        console.log(resultado);
        if(!JSON.parse(resultado.exito))
        {
            alert(resultado.mensaje);
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1500);
        }

        let tabla:string = ArmarTablaArticulos(JSON.parse(resultado.dato));

        $("#divTablaIzq").html(tabla).show(1000);

        $('[data-action="modificar"]').on('click', function (e) {
            
            let obj_prod_string : any = $(this).attr("data-obj_prod");
            let obj_prod = JSON.parse(obj_prod_string);

            let formulario = MostrarForm("modificacion", obj_prod);
        
            $("#cuerpo_modal_prod").html(formulario);           
        });
   
        $('[data-action="eliminar"]').on('click', function (e) {

            let obj_prod_string : any = $(this).attr("data-obj_prod");
            let obj_prod = JSON.parse(obj_prod_string);

            let formulario = MostrarForm("baja", obj_prod);
        
            $("#cuerpo_modal_prod").html(formulario);
        });
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {

        let retorno = JSON.parse(jqXHR.responseText);

        let alerta:string = ArmarAlert(retorno.mensaje, "danger");

        $("#divTablaIzq").html(alerta).show(2000);
    });    
}

function ArmarTablaArticulos(productos:[]) : string 
{   
    let tabla:string = '<table class="table table-dark table-hover">';
    tabla += '<tr><th>ID</th><th>TIPO</th><th>PRECIO</th><th>FOTO</th><th style="width:110px">ACCIONES</th></tr>';

    if(productos.length == 0)
    {
        tabla += '<tr><td>---</td><td>---</td><td>---</td><td>---</td><th>---</td></tr>';
    }
    else
    {
        productos.forEach((prod : any) => {

            tabla += "<tr><td>"+prod.id+"</td><td>"+prod.tipo+"</td><td>"+prod.precio+"</td>"+
            "<td><img src='"+URL_API+prod.path_foto+"' width='50px' height='50px'></td><th>"+
            "<a href='#' class='btn' data-action='modificar' data-obj_prod='"+JSON.stringify(prod)+"' title='Modificar'"+
            "style='background-color: greenyellow';  </a>MODIFICAR"+
            "<a href='#' class='btn' data-action='eliminar' data-obj_prod='"+JSON.stringify(prod)+"' title='Eliminar'"+
            "style='background-color: red'; </a>ELIMINAR"+
            "</td></tr>";
        });
    }

    tabla += "</table>";

    return tabla;
}

function MostrarForm(accion:string, obj_prod:any=null) : string 
{
    let funcion = "";
    let encabezado = "";
    let solo_lectura = "";
    let solo_lectura_pk = "";

    switch (accion) {
         case "baja":
            funcion = 'Eliminar(event)';
            encabezado = 'ELIMINAR ARTICULO';
            solo_lectura = "readonly";
            solo_lectura_pk = "readonly";
            break;
    
        case "modificacion":
            funcion = 'Modificar(event)';
            encabezado = 'MODIFICAR ARTICULO';
            solo_lectura_pk = "readonly";
            break;
    }

    let id = "";
    let tipo = "";
    let precio = "";
    let path = URL_BASE+"/img/usr_default.jpg";

    if (obj_prod !== null) 
    {
        id = obj_prod.id;
        tipo = obj_prod.tipo;
        precio = obj_prod.precio;
        path = URL_API + obj_prod.path_foto;       
    }

    let form:string = '<h3 style="padding-top:1em;">'+encabezado+'</h3>\
                        <div class="row justify-content-center">\
                            <div class="col-md-8">\
                                <form class="was-validated">\
                                    <div class="form-group">\
                                        <label for="id">ID:</label>\
                                        <input type="text" class="form-control " id="id" value="'+id+'" '+solo_lectura_pk+' required>\
                                    </div>\
                                    <div class="form-group">\
                                        <label for="tipo">TIPO:</label>\
                                        <input type="text" class="form-control" id="tipo" placeholder="Ingresar tipo"\
                                            name="tipo" value="'+tipo+'" '+solo_lectura+' required>\
                                        <div class="valid-feedback">OK.</div>\
                                        <div class="invalid-feedback">Valor requerido.</div>\
                                    </div>\
                                    <div class="form-group">\
                                        <label for="precio">Precio:</label>\
                                        <input type="number" class="form-control" id="precio" placeholder="Ingresar precio" name="precio"\
                                            value="'+precio+'" '+solo_lectura+' required>\
                                        <div class="valid-feedback">OK.</div>\
                                        <div class="invalid-feedback">Valor requerido.</div>\
                                    </div>\
                                    <div class="form-group">\
                                        <label for="foto">Foto:</label>\
                                        <input type="file" class="form-control" id="foto" name="foto" '+solo_lectura+' required>\
                                        <div class="valid-feedback">OK.</div>\
                                        <div class="invalid-feedback">Valor requerido.</div>\
                                    </div>\
                                    <div class="row justify-content-between"><img id="img_prod" src="'+path+'" width="400px" height="200px"></div><br>\
                                    <div class="row justify-content-between">\
                                        <input type="button" class="btn btn-danger" data-dismiss="modal" value="Cerrar">\
                                        <button type="submit" class="btn btn-primary" data-dismiss="modal" onclick="'+funcion+'" >Aceptar</button>\
                                    </div>\
                                </form>\
                            </div>\
                        </div>';

    return form;
}

function Agregar():void 
{  

    let jwt = localStorage.getItem("jwt");

    let tipo = $("#txtTipo").val();
    let precio = $("#txtPrecio").val();
    let foto: any = (<HTMLInputElement>document.getElementById("txtFoto"));

    let form = new FormData();
    form.append("articulo_json", JSON.stringify({"tipo":tipo, "precio":precio}));
    form.append("foto", foto.files[0]);

    $.ajax({
        type: 'POST',
        url: URL_API + "agregarArticuloBD",
        dataType: "json",
        cache: false,
        contentType: false,
        processData: false,
        data: form,
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (resultado:any) {

        console.log(resultado);

        if(!JSON.parse(resultado.exito))
        {
            alert(resultado.mensaje);
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1500);
        }
        let alerta:string = ArmarAlert(resultado.mensaje);

        $("#divTablaDer").html(alerta);

        ObtenerListadoArticulos();
        
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {

        let retorno = JSON.parse(jqXHR.responseText);

        let alerta:string = ArmarAlert(retorno.mensaje, "danger");

        $("#divTablaDer").html(alerta);

    });    
}

function Eliminar(e:any):void 
{
    e.preventDefault();

    let jwt = localStorage.getItem("jwt");

    let id = $("#id").val();

    $.ajax({
        type: 'DELETE',
        url: URL_API + "artis",
        dataType: "json",
        data: {"id_articulo":id},
        headers : {'Authorization': 'Bearer ' + jwt},
        async: true
    })
    .done(function (resultado:any) {

        console.log(resultado);

        if(!JSON.parse(resultado.exito))
        {
            alert(resultado.mensaje);
            setTimeout(() => {
                $(location).attr('href', URL_BASE + "login.html");
            }, 1500);
        }

        ObtenerListadoArticulos();
        
        $("#cuerpo_modal_prod").html("");
    })
    .fail(function (jqXHR:any, textStatus:any, errorThrown:any) {

        let retorno = JSON.parse(jqXHR.responseText);

        let alerta:string = ArmarAlert(retorno.mensaje, "danger");

        $("#divTablaIzq").html(alerta);

    });    
}
