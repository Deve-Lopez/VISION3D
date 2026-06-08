import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { TrackballControls } from "three-stdlib";

export default function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer:coarse)").matches;
    const controls = new TrackballControls(camera, gl.domElement);

    controls.rotateSpeed            = isTouchDevice ? 2.2 : 3.0;
    controls.zoomSpeed              = isTouchDevice ? 0.6 : 1.2;
    controls.panSpeed               = isTouchDevice ? 0.6 : 0.8;
    controls.noZoom                 = false;
    controls.noPan                  = false;
    controls.staticMoving           = false;
    controls.dynamicDampingFactor   = 0.2;

    const handleMouseUp = () => controls.handleMouseUp?.();
    window.addEventListener("mouseup", handleMouseUp);

    controlsRef.current = controls;
    return () => {
      controls.dispose();
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [camera, gl]);

  useFrame(() => controlsRef.current?.update());

  return null;
}