import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

const style = {
    height: 500 // we can control scene size by setting container dimensions
};

const App = ({ colors, onMeshUpdate, onProgress, elephColor, addEleph, removeEleph }) => {
    const thisRef = useRef({});
    const mountRef = useRef(null);

    useEffect(() => {
        thisRef.current.sceneSetup();
        thisRef.current.addLights();
        thisRef.current.loadTheModel();
        thisRef.current.startAnimationLoop();
        window.addEventListener('resize', thisRef.current.handleWindowResize);
        return () => {
            window.removeEventListener('resize', thisRef.current.handleWindowResize);
            window.cancelAnimationFrame(thisRef.current.requestID);
            thisRef.current.controls.dispose();
        };
    }, []);

    useEffect(() => {
        if (thisRef.current.model) {
            thisRef.current.model.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const colorIndex = thisRef.current.meshes.indexOf(child);
                    if (colorIndex !== -1 && colors[colorIndex]) {
                        child.material.color.setHex(colors[colorIndex]); // Apply the specific color
                    }
                }
            });
        }
    }, [colors]);

    useEffect(() => {
        if (thisRef.current.eleph) {
            thisRef.current.eleph.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.material.color.setHex(elephColor); // Update the color of the added model
                }
            });
        }
    }, [elephColor]);

    useEffect(() => {
        if (addEleph) {
            thisRef.current.addEleph();
        }
    }, [addEleph]);

    useEffect(() => {
        if (removeEleph) {
            thisRef.current.removeEleph();
        }
    }, [removeEleph]);

    thisRef.current.sceneSetup = () => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        thisRef.current.scene = new THREE.Scene();
        thisRef.current.camera = new THREE.PerspectiveCamera(
            75, // fov = field of view
            width / height, // aspect ratio
            0.1, // near plane
            1000 // far plane
        );
        thisRef.current.camera.position.z = 25;
        thisRef.current.controls = new OrbitControls(thisRef.current.camera, mountRef.current);
        thisRef.current.renderer = new THREE.WebGLRenderer();
        thisRef.current.renderer.setSize(width, height);
        mountRef.current.appendChild(thisRef.current.renderer.domElement);
    };

    thisRef.current.loadTheModel = () => {
        const loader = new OBJLoader();
        loader.load(
            'new.obj',
            (object) => {
                console.log("Model loaded:", object);
                const meshes = [];
                object.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Default white
                        meshes.push(child); // Collect all meshes
                    }
                })
                console.log("Meshes:", meshes);
                thisRef.current.model = object;
                thisRef.current.meshes = meshes;

                // Initialize colors for each mesh
                thisRef.current.meshes.forEach((mesh, index) => {
                    mesh.material.color.setHex(colors[index] || 0xffffff); // Set default color
                });

                thisRef.current.scene.add(object);
                const box = new THREE.Box3().setFromObject(object);
                const center = new THREE.Vector3();
                box.getCenter(center);
                object.position.sub(center);

                // Notify parent of loaded meshes
                onMeshUpdate(thisRef.current.meshes);
            },
            (xhr) => {
                const loadingPercentage = Math.ceil((xhr.loaded / xhr.total) * 100);
                onProgress(loadingPercentage);
            },
            (error) => {
                console.log('An error happened:' + error);
            }
        );
    };

    thisRef.current.addEleph = () => {
        const loader = new OBJLoader();
        loader.load(
            'eleph.obj',
            (object) => {
                console.log("Eleph Model loaded:", object);
                object.scale.set(0.01, 0.01, 0.01);
                object.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshStandardMaterial({ color: elephColor });
                    }
                });
                thisRef.current.eleph = object;
                thisRef.current.scene.add(object);

                // Center the object
                const box = new THREE.Box3().setFromObject(object);
                const center = new THREE.Vector3();
                box.getCenter(center);
                object.position.sub(center);
            },
            (xhr) => {
                const loadingPercentage = Math.ceil((xhr.loaded / xhr.total) * 100);
                onProgress(loadingPercentage);
            },
            (error) => {
                console.log('An error happened:' + error);
            }
        );
    };

    thisRef.current.removeEleph = () => {
        if (thisRef.current.eleph) {
            thisRef.current.scene.remove(thisRef.current.eleph);
            thisRef.current.eleph = null;
        }
    };

    thisRef.current.addLights = () => {
        const lights = [];

        lights[0] = new THREE.PointLight(0xffffff, 1, 0);
        lights[1] = new THREE.PointLight(0xffffff, 1, 0);
        lights[2] = new THREE.PointLight(0xffffff, 1, 0);

        lights[0].position.set(0, 2000, 0);
        lights[1].position.set(1000, 2000, 1000);
        lights[2].position.set(-1000, -2000, -1000);

        thisRef.current.scene.add(lights[0]);
        thisRef.current.scene.add(lights[1]);
        thisRef.current.scene.add(lights[2]);
    };

    thisRef.current.startAnimationLoop = () => {
        thisRef.current.renderer.render(thisRef.current.scene, thisRef.current.camera);
        thisRef.current.requestID = window.requestAnimationFrame(thisRef.current.startAnimationLoop);
    };

    thisRef.current.handleWindowResize = () => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        thisRef.current.renderer.setSize(width, height);
        thisRef.current.camera.aspect = width / height;
        thisRef.current.camera.updateProjectionMatrix();
    };

    return <div style={style} ref={mountRef} />;
};

const Container = () => {
    const [state, setState] = useState({ isMounted: true });
    const [colors, setColors] = useState([]);
    const [elephColor, setElephColor] = useState(0xffffff); // Default color for added model
    const [meshes, setMeshes] = useState([]);
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [addEleph, setAddEleph] = useState(false);
    const [removeEleph, setRemoveEleph] = useState(false);

    const { isMounted } = state;

    const handleColorChange = (index) => (e) => {
        const newColor = e.target.value;
        setColors(prevColors => {
            const updatedColors = [...prevColors];
            updatedColors[index] = parseInt(newColor.replace("#", "0x"), 16);
            return updatedColors;
        });
    };

    const handleElephColorChange = (e) => {
        const newColor = e.target.value;
        setElephColor(parseInt(newColor.replace("#", "0x"), 16));
    };

    return (
        <>
            <button onClick={() => setState({ ...state, isMounted: !isMounted })}>
                {isMounted ? "Unmount" : "Mount"}
            </button>
            <button onClick={() => { setAddEleph(true); setRemoveEleph(false); }}>
                Add Elephant
            </button>
            <button onClick={() => { setAddEleph(false); setRemoveEleph(true); }}>
                Remove Elephant
            </button>
            {isMounted && (
                <App
                    colors={colors}
                    elephColor={elephColor}
                    onMeshUpdate={setMeshes}
                    onProgress={setLoadingPercentage}
                    addEleph={addEleph}
                    removeEleph={removeEleph}
                />
            )}
            {isMounted && loadingPercentage === 100 && (
                <>
                    <div>
                        Scroll to zoom, drag to rotate
                    </div>
                    {meshes.map((mesh, index) => (
                        <div key={index}>
                            <label>
                                Object {index + 1} Color:
                                <input
                                    type="color"
                                    value={colors[index] ? `#${colors[index].toString(16).padStart(6, '0')}` : '#ffffff'}
                                    onChange={handleColorChange(index)}
                                />
                            </label>
                        </div>
                    ))}
                    <div>
                        <label>
                            Elephant Color:
                            <input
                                type="color"
                                value={`#${elephColor.toString(16).padStart(6, '0')}`}
                                onChange={handleElephColorChange}
                            />
                        </label>
                    </div>
                </>
            )}
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<Container />);
