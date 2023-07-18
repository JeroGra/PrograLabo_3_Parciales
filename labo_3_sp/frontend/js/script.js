"use strict";
/// <reference path="../node_modules/@types/jquery/index.d.ts" />
$(() => {
    $("#btnEnviar").on("click", (e) => {
        e.preventDefault();
        let clave = $("#clave").val();
        let correo = $("#correo").val();
        let dato = {};
        dato.clave = clave;
        dato.correo = correo;
        $.ajax({
            type: 'POST',
            url: URL_API + "login",
            dataType: "json",
            data: dato,
            async: true
        })
            .done(function (obj_ret) {
            console.log(obj_ret);
            let alerta = "";
            if (obj_ret.exito) {
                //GUARDO EN EL LOCALSTORAGE
                localStorage.setItem("jwt", obj_ret.jwt);
                alert(obj_ret.mensaje + " redirigiendo al principal.php...");
                //  alerta = ArmarAlert(obj_ret.mensaje + " redirigiendo al principal.php...");
                setTimeout(() => {
                    $(location).attr('href', URL_BASE + "principal.html");
                }, 2000);
            }
            // $("#div_mensaje").html(alerta);
        })
            .fail(function (jqXHR, textStatus, errorThrown) {
            let retorno = JSON.parse(jqXHR.responseText);
            alert(retorno.mensaje);
            // let alerta:string = ArmarAlert(retorno.mensaje, "danger");
            // $("#div_mensaje").html(alerta);
        });
    });
});
//# sourceMappingURL=script.js.map