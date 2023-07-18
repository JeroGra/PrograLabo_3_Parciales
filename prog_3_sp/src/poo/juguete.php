<?php
namespace ElMuñeco
{

    use AccesoDatos;
    use borrarFoto;
    use Error;
    use ISlimeable;
    use PDO;
    use Psr\Http\Message\ResponseInterface as Response;
    use Psr\Http\Message\ServerRequestInterface as Request;
    use stdClass;

    require_once "accesodatos.php";
    class Juguete  
    {

         public int $id;
         public string $marca;
         public float $precio;
         public string $path_foto;
        

         ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        ///////// IMPLEMENTACIONES DE INTERFAZ ////////////////////////////////////////////////////////////////////////////////////////////////////
       
        //////////////// LISTAR TODOS LOS OBJ //////////////////////////////////////////////////
        public function TraerTodos(Request $request, Response $response, array $args): Response 
        {
            try
            {
                $juguetes = Juguete::traerJuguetes();

                $respuesta = new stdClass;
                $respuesta->mensaje = "listado juguetes";
                $respuesta->exito = true;
                $respuesta->dato = $juguetes;

                $newResponse = $response->withStatus(200, "OK");
                $newResponse->getBody()->write(json_encode($respuesta));

            }
            catch(Error)
            {
                $respuesta = new stdClass;
                $respuesta->exito = false;
                $respuesta->lista = json_encode("");

                $newResponse = $response->withStatus(424, "ERROR");
                $newResponse->getBody()->write(json_encode($respuesta));
            }
            finally
            {
                return $newResponse->withHeader('Content-Type', 'application/json');	

            }  
        }

        /////// AGREGAR ///////////////////////////////////////////////////////////////////////
        public function AgregarUno(Request $request, Response $response, array $args): Response 
        {
            try
            {
                $obj = new Stdclass;
                $obj = json_decode($request->getParsedBody()['juguete_json']);                              
            
                $miJ = new Juguete();
                $miJ->marca = $obj->marca;
                $miJ->precio = $obj->precio;
        
                //// TOMO EL ARCHIVO Y LO GUARDO EN FOTOS /////////////////////////////////////////////////////////
                $archivos = $request->getUploadedFiles();
                $destino = __DIR__ . "/../fotos/";
        
                $nombreAnterior = $archivos['foto']->getClientFilename();
                $extension = explode(".", $nombreAnterior);
        
                $extension = array_reverse($extension);

                $path = "./fotos/". $obj->marca . "." . $extension[0];
        
                $archivos['foto']->moveTo($destino . $obj->marca .  "." . $extension[0]);

                $miJ->path_foto = $path;
                //////// MODIFICO MI USUARIO PARA AGREGARLE EL PATH DE LA FOTO /////////////////////////////////////
                $id_agregado = $miJ->instertarJuguete();

                $objDelaRespuesta = new stdClass();
                $objDelaRespuesta->exito = ($id_agregado != NULL && $id_agregado > 0);
                $objDelaRespuesta->mensaje = "Juguete Agregado";
    
                $newResponse = $response->withStatus(200, "OK");
                $newResponse->getBody()->write(json_encode($objDelaRespuesta));
            }
            catch(Error)
            {
                $objDelaRespuesta = new stdClass();
                $objDelaRespuesta->exito = false;
                $objDelaRespuesta->mensaje = "Ocurrio un Error";
    
                $newResponse = $response->withStatus(418, "ERROR");
                $newResponse->getBody()->write(json_encode($objDelaRespuesta));
            }
            finally
            {
                return $newResponse->withHeader('Content-Type', 'application/json');
            }
    
        }

          ////////////////////////// BORRAR UNO //////////////////////////////////////////////////
          public function BorrarUno(Request $request, Response $response, array $args): Response 
          {		 
               $objDeLaRespuesta = new stdclass();
               $objDeLaRespuesta->exito = false;

               $dir ="../src/fotos";

                $id = $args['id_juguete'];
                $juguete = new Juguete();
                $juguete->id = $id;

                $obj =new stdClass;
                $obj = Juguete::obtenerUno($id);

                $cantidadDeBorrados = $juguete->borrarJuguete();

                if($cantidadDeBorrados>0)
                {

                    $path = ".".$obj->path_foto;
                    \var_dump(unlink( $path));
                    $objDeLaRespuesta->exito = true;
                    $objDeLaRespuesta->foto = "foto borrada";
                    $newResponse = $response->withStatus(200, "OK");
                    $newResponse->getBody()->write(json_encode($objDeLaRespuesta));	
                }
                else
                {
                    $objDeLaRespuesta->mensaje = "Error al borrar, id invalido";
                    $newResponse = $response->withStatus(418);
                    $newResponse->getBody()->write(json_encode($objDeLaRespuesta));	
                }             
  
              return $newResponse->withHeader('Content-Type', 'application/json');
          }

          ///// MODIFICAR /////////////////////////////////////////////////////////////////////////
         public function ModificarUno(Request $request, Response $response, array $args): Response
          {
              
            try
            {
                $obj = new Stdclass;
                $obj = json_decode($request->getParsedBody()['juguete']);       

                $miJ = new Juguete();
                $miJ->id = $obj->id_juguete;
                $miJ->marca = $obj->marca;
                $miJ->precio = $obj->precio;

                
                $archivos = $request->getUploadedFiles();
                $destino = __DIR__ . "/../fotos/";
                
                $nombreAnterior = $archivos['foto']->getClientFilename();
                $extension = explode(".", $nombreAnterior);
                
                $path = "./fotos/". $obj->marca . "_" . "modificado". "." . $extension[0];

                $extension = array_reverse($extension);
    
                $archivos['foto']->moveTo($destino . $obj->marca . "_" . "modificado" . "." . $extension[0]);

                $miJ->path_foto = $path;
                
                $resultado = $miJ->modificarJuguete();
                
                $objDelaRespuesta = new stdclass();
                $objDelaRespuesta->resultado = $resultado;
                $objDelaRespuesta->mensaje = "Juguete Modificado";

                $newResponse = $response->withStatus(200, "OK");
                $newResponse->getBody()->write(json_encode($objDelaRespuesta));
            }
            catch(Error)
            {
               $objDelaRespuesta = new stdClass();
               $objDelaRespuesta->exito = false;
               $objDelaRespuesta->mensaje = "Ocurrio un Error";
   
               $newResponse = $response->withStatus(418, "ERROR");
               $newResponse->getBody()->write(json_encode($objDelaRespuesta));
            }
            finally
            {
               return $newResponse->withHeader('Content-Type', 'application/json');		
            }  
       
           }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        ///////// FUNCIONES PROPIAS ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        //////////////// LISTAR TODOS LOS OBJ //////////////////////////////////////////////////
        public static function traerJuguetes()
        {
            $objetoAccesoDato = AccesoDatos::dameUnObjetoAcceso(); 
            $consulta = $objetoAccesoDato->retornarConsulta("select id, marca as marca, precio as precio, path_foto as path_foto from juguetes");
            $consulta->execute();
            //NO ME RECONOCE AUTO ASI QUE UTILIZO stdClass			
            return $consulta->fetchAll(PDO::FETCH_CLASS, "stdClass");		
        }

        /////// AGREGAR ///////////////////////////////////////////////////////////////////////
       public function instertarJuguete()
        {
            $objetoAccesoDato = AccesoDatos::dameUnObjetoAcceso(); 
            $consulta = $objetoAccesoDato->retornarConsulta("INSERT into juguetes (marca,precio,path_foto)values(:marca,:precio,:path_foto)");
            $consulta->bindValue(':marca', $this->marca, PDO::PARAM_STR);
            $consulta->bindValue(':precio', $this->precio, PDO::PARAM_INT);
            $consulta->bindValue(':path_foto', $this->path_foto, PDO::PARAM_STR);
            $consulta->execute();		
            return $objetoAccesoDato->retornarUltimoIdInsertado();
        }
        /////// MODIFICAR ///////////////////////////////////////////////////////////////////////
        public function modificarJuguete()
        {
            $objetoAccesoDato = AccesoDatos::dameUnObjetoAcceso(); 
            $consulta = $objetoAccesoDato->retornarConsulta("
                    update juguetes 
                    set marca=:marca,
                    precio=:precio,
                    path_foto=:path_foto
                    where id=:id");
            $consulta->bindValue(':id', $this->id, PDO::PARAM_INT);
            $consulta->bindValue(':marca', $this->marca, PDO::PARAM_STR);
            $consulta->bindValue(':precio', $this->precio, PDO::PARAM_INT);
            $consulta->bindValue(':path_foto', $this->path_foto, PDO::PARAM_STR);
            return $consulta->execute();
         }

        /// BORRAR 
        public function borrarJuguete()
        {
            $objetoAccesoDato = AccesoDatos::dameUnObjetoAcceso(); 
            $consulta = $objetoAccesoDato->RetornarConsulta("delete from juguetes WHERE id=:id");	
            $consulta->bindValue(':id',$this->id, PDO::PARAM_INT);		
            $consulta->execute();
            return $consulta->rowCount();
        }

        public static function obtenerUno($id)
        {
           $objetoAccesoDato = AccesoDatos::dameUnObjetoAcceso(); 
           $consulta = $objetoAccesoDato->retornarConsulta("select *
           from juguetes WHERE id = $id");
           $consulta->execute();            
           $UsuarioBuscado = $consulta->fetchObject('stdClass');

           return $UsuarioBuscado;
        }

        
    }

}