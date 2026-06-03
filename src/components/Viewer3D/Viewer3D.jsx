import { Suspense, useEffect, useRef, useState, memo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Grid, Environment } from "@react-three/drei";
import { TrackballControls } from "three-stdlib";
import * as THREE from "three";

// Componentes internos delegados para cargar geometrías y estados cargando
import ModelLoader from "../ModelLoader/ModelLoader";
import Loader3D from "../Loader3D/Loader3D";
import styles from "./Viewer3D.module.css";

/**
 * Diccionario local estático.
 * Vincula el string básico (id) enviado desde la Sidebar con la ruta relativa real
 * de los archivos .hdr almacenados físicamente en la carpeta raíz /public/environments/
 */
const LOCAL_ENV_FILES = {
  sunset: "/environments/venice_sunset_1k.hdr",
  dawn: "/environments/kiara_1_dawn_1k.hdr",
  night: "/environments/dikhololo_night_1k.hdr",
  warehouse: "/environments/empty_warehouse_01_1k.hdr",
  forest: "/environments/forest_slope_1k.hdr",
  apartment: "/environments/lebombo_1k.hdr",
  studio: "/environments/studio_small_03_1k.hdr",
  city: "/environments/potsdamer_platz_1k.hdr",
  lobby: "/environments/st_fagans_interior_1k.hdr",
};

/**
 * Subcomponente: CameraFitter
 * Se encarga de calcular el tamaño del objeto 3D cargado dinámicamente y ajustar la posición
 * y parámetros de la cámara de manera matemática para asegurar que el modelo se encuadre a la perfección.
 */
function CameraFitter({ modelUrl }) {
  const { camera, scene } = useThree();
  const fitted = useRef(null); // Evita recálculos constantes en cada frame si el modelo no cambia

  // Reinicia la referencia de ajuste si el usuario cambia el modelo actual
  useEffect(() => { fitted.current = null; }, [modelUrl]);

  useFrame(() => {
    // Si no hay modelo, o el modelo ya ha sido encuadrado previamente, salimos anticipadamente
    if (!modelUrl || fitted.current === modelUrl) return;

    let hasMesh = false;
    // Recorremos la escena buscando si ya existen mallas cargadas por el subcomponente ModelLoader
    scene.traverse((o) => { if (o.isMesh) hasMesh = true; });
    if (!hasMesh) return; // Si aún está vacío (descargando), esperamos al siguiente frame

    // Calculamos el volumen espacial exacto ocupado por los objetos 3D cargados
    const box = new THREE.Box3();
    scene.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3()); // Coordenadas del centro real del modelo
    const size = box.getSize(new THREE.Vector3());     // Dimensiones espaciales (Ancho, alto, profundidad)
    const maxDim = Math.max(size.x, size.y, size.z);   // Medida del lado más largo

    // Cálculo matemático trigonométrico basado en el campo de visión (FOV) para posicionar la cámara a la distancia ideal
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.5;

    // Vector de dirección oblicuo para que la cámara no mire de frente rígido, sino con un ángulo estético
    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    camera.position.copy(center).addScaledVector(direction, distance); // Desplazamos la cámara hacia atrás
    camera.lookAt(center); // Enfocamos el centro exacto del objeto

    // Ajustamos planos de recorte (near/far clipping fields) en función del tamaño del modelo para evitar artefactos visuales
    camera.near = distance * 0.01;
    camera.far = distance * 100;
    camera.updateProjectionMatrix(); // Obliga a WebGL a actualizar la proyección interna

    fitted.current = modelUrl; // Marcamos como encuadrado
  });

  return null;
}

/**
 * Subcomponente: Controls
 * Inyecta y maneja los controles Trackball (rotación libre sin gimbal-lock, paneo y zoom infinito) sobre el canvas.
 */
function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    // Detectamos mediante Media Queries si es un teléfono o tablet táctil para ajustar la sensibilidad
    const isTouchDevice = window.matchMedia("(pointer:coarse)").matches;
    
    // Instanciamos los controles pasándole la cámara de la escena y el contenedor DOM del canvas
    const controls = new TrackballControls(camera, gl.domElement);

    // Configuración fina de comportamiento y velocidades adaptativas
    controls.rotateSpeed            = isTouchDevice ? 2.2 : 3.0;
    controls.zoomSpeed              = isTouchDevice ? 0.6 : 1.2;
    controls.panSpeed               = isTouchDevice ? 0.6 : 0.8;
    controls.noZoom                 = false;
    controls.noPan                  = false;
    controls.staticMoving           = false;
    controls.dynamicDampingFactor   = 0.2; // Suavizado de frenada (Inercia)

    // Parche seguro de eventos de ratón para prevenir bloqueos de rotación infinitos al arrastrar fuera
    const handleMouseUp = () => controls.handleMouseUp?.();
    window.addEventListener("mouseup", handleMouseUp);

    controlsRef.current = controls;
    return () => {
      // Limpieza estructural obligatoria al desmontar el componente para evitar fugas de memoria GPU y eventos fantasma
      controls.dispose();
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [camera, gl]);

  // Actualiza la posición de los controles en cada cuadro de renderizado para mantener la fluidez
  useFrame(() => controlsRef.current?.update());

  return null;
}

/**
 * Subcomponente: WireframeUpdater
 * Actúa como un interceptor en tiempo de ejecución. Cambia la propiedad `.wireframe` de todos los
 * materiales pertenecientes exclusivamente al modelo cargado sin tener que reconstruir la geometría entera.
 */
function WireframeUpdater({ showWireframe, modelGroupRef }) {
  useFrame(() => {
    if (!modelGroupRef.current) return; // Si el modelo sigue cargando, salta el frame

    // Recorre todos los nodos hijos que estén dentro del grupo contenedor del modelo
    modelGroupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        // Un objeto puede tener un material único o una matriz de materiales (multi-material)
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          // Si el estado del material no coincide con el del interruptor UI, lo actualizamos directamente en la GPU
          if (mat.wireframe !== showWireframe) {
            mat.wireframe = showWireframe;
          }
        });
      }
    });
  });

  return null;
}

/**
 * Componente Intermedio: Scene (Optimizado con React.memo)
 * Contiene todos los elementos que viven dentro de WebGL. Está memorizado para evitar re-renderizados 
 * innecesarios del ecosistema global 3D cuando cambian propiedades externas del contenedor HTML.
 */
const Scene = memo(function Scene({ modelUrl, modelExt, showGrid, envPreset, onStats, showWireframe }) {
  const modelGroupRef = useRef(); // Referencia aislada para agrupar únicamente las mallas del modelo importado

  // Traduce el ID de entorno limpio recibido en una ruta física con extensión .hdr usando nuestro diccionario
  const envFile = LOCAL_ENV_FILES[envPreset] || LOCAL_ENV_FILES.sunset;

  return (
    <>
      {/* Configuración base de Iluminación de relleno global */}
      <ambientLight intensity={0.6} />
      {/* Luz focal principal que simula luz solar para generar sombras nítidas */}
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      {/* Luz de contra secundaria tenue para rellenar los lados oscuros del modelo */}
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      
      {/* ILUMINACIÓN DE ENTORNO HDRI:
        Envolvemos el componente en un bloque Suspense ya que Three.js carga el archivo .hdr de forma asíncrona.
        La propiedad 'key={envPreset}' es CRUCIAL: fuerza a React a destruir el entorno previo y 
        montar de inmediato el nuevo en la GPU cuando el usuario cambia de preset en la Sidebar.
      */}
      <Suspense fallback={null}>
        {envFile && (
          <Environment key={envPreset} files={envFile} />
        )}
      </Suspense>

      {/* Renderizado condicional de la cuadrícula adaptativa del suelo */}
      {showGrid && (
        <Grid
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={3}
          sectionThickness={1}
          fadeDistance={30}
          cellColor="#334155"
          sectionColor="#475569"
        />
      )}

      {/* Contenedor del cargador dinámico del modelo 3D */}
      <group ref={modelGroupRef}>
        {/* Enquanto descarga el modelo de internet o procesa el blob binario local, renderiza la UI intermedia Loader3D */}
        <Suspense fallback={<Loader3D />}>
          {modelUrl && (
            <ModelLoader
              url={modelUrl}
              ext={modelExt}
              onStats={onStats}
              showWireframe={showWireframe}
            />
          )}
        </Suspense>
      </group>

      {/* Controladores internos que escuchan los frames del bucle de Three.js */}
      <WireframeUpdater showWireframe={showWireframe} modelGroupRef={modelGroupRef} />
      <CameraFitter modelUrl={modelUrl} />
      <Controls />
    </>
  );
});

/**
 * Componente Principal Exportado: Viewer3D
 * Genera la estructura HTML base, inicializa el contexto de renderizado de Canvas de WebGL y pinta el HUD de estadísticas.
 */
export default function Viewer3D({ modelUrl, modelExt, showGrid, showWireframe, envPreset, bgColor }) {
  const [stats, setStats] = useState(null); // Estado local para guardar los recuentos analíticos del modelo (polígonos/vértices)

  // Resetea el panel HUD analítico cada vez que un nuevo archivo inicia su proceso de carga
  useEffect(() => { setStats(null); }, [modelUrl]);

  return (
    /* El estilo en línea (inline-style) de background se mantiene aquí intencionalmente para actualizar el color picker en tiempo real sin latencias */
    <main className={styles.canvasWrap} style={{ backgroundColor: bgColor }}>
      
      {/* Vista de estado vacío (Empty State) si no hay ningún archivo en memoria */}
      {!modelUrl && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◈</div>
          <p>Carga un modelo para empezar</p>
        </div>
      )}

      {/* Inicializador global de @react-three/fiber (Contexto WebGL de alto rendimiento) */}
      <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
        <Scene
          modelUrl={modelUrl}
          modelExt={modelExt}
          showGrid={showGrid}
          showWireframe={showWireframe}
          envPreset={envPreset}
          onStats={setStats} // Callback que devuelve las analíticas calculadas por el ModelLoader hacia este padre
        />
      </Canvas>

      {/* HUD flotante flotante que muestra analíticas de geometría 3D en tiempo real si el modelo las provee */}
      {stats && (
        <div className={styles.statsHud}>
          <span className={styles.statsCount}>▲ {stats.polygons}</span> polígonos
          <br />
          <span className={styles.statsCount}>● {stats.vertices}</span> vértices
        </div>
      )}
    </main>
  );
}