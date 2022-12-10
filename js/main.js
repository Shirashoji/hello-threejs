const KEY_UP = 12;
const KEY_DOWN = 13;
const KEY_RIGHT = 15;
const KEY_LEFT = 14;
const KEY_A = 3;
const KEY_B = 2;
const KEY_C = 1;
const KEY_D = 0;
class GameController {
    constructor() {
        this.gamepads = {};
        this.keys = {};

        const gamepadHandler = (event, connecting) => {
            var gamepad = event.gamepad;
            if (connecting) {
                const buttons = new Array(gamepad.buttons.length).fill(false);
                this.gamepads[gamepad.index] = {
                    gamepad: navigator.getGamepads()[gamepad.index],
                    buttons,
                };
            } else {
                delete this.gamepads[gamepad.index];
            }
        };

        window.addEventListener(
            "gamepadconnected",
            (e) => {
                gamepadHandler(e, true);
            },
            false
        );
        window.addEventListener(
            "gamepaddisconnected",
            (e) => {
                gamepadHandler(e, false);
            },
            false
        );

        window.addEventListener("keydown", (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
    }
    idle() {
        console.log(this.gamepads);
    }
    button(index) {
        const keys = Object.keys(this.gamepads);
        let buttons = [];
        keys.some((key) => {
            buttons = navigator.getGamepads()[key].buttons.map((v) => v.pressed);
            return true;
        });
        return buttons && buttons.length > index ? buttons[index] : false;
    }
    axes(index) {
        let axis = [];
        keys.some((key) => {
            buttons = navigator.getGamepads()[key].axes.map((v) => v);
            return true;
        });
        return axes && axes.length > index ? axes[index] : false;
    }
    up() {
        return this.keys["ArrowUp"] || this.button(KEY_UP);
    }
    down() {
        return this.keys["ArrowDown"] || this.button(KEY_DOWN);
    }
    left() {
        return this.keys["ArrowLeft"] || this.button(KEY_LEFT);
    }
    right() {
        return this.keys["ArrowRight"] || this.button(KEY_RIGHT);
    }
    action() {
        return (
            this.keys["Space"] ||
            this.button(KEY_A) ||
            this.button(KEY_B) ||
            this.button(KEY_C) ||
            this.button(KEY_D)
        );
    }
}

class GameObject {
    constructor(obj) {
        this.obj = obj;
        this.box = new THREE.Box3();
    }
    get name() {
        return this.obj.name;
    }
    get position() {
        return this.obj.position;
    }
    get scale() {
        return this.obj.scale;
    }
    get rotation() {
        return this.obj.rotation;
    }
    idle() { }
}

class AvaterObject extends GameObject {
    idle() {
        super.idle();
        const speed = 0.025;
        if (gameController.left()) {
            this.position.x -= speed;
        }
        if (gameController.right()) {
            this.position.x += speed;
        }
        if (gameController.up()) {
            this.position.z -= speed;
        }
        if (gameController.down()) {
            this.position.z += speed;
        }
        if (gameController.action()) {
            //
        }
    }
}

class FieldObject extends GameObject {
    constructor(obj) {
        super(obj);
        this.children = [];
        obj.children.forEach((o) => {
            if (o.name !== "wall") {
                const g = new GameObject(o);
                g.box = new THREE.Box3();
                this.children.push(g);
            }
        });
    }
    containsPoint(pos) {
        return this.children.filter((mesh) => {
            return mesh.box.containsPoint(pos);
        });
    }
    idle() {
        this.children.forEach((mesh) => {
            mesh.box.copy(mesh.obj.geometry.boundingBox).applyMatrix4(this.obj.matrixWorld);
        });
    }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const directionalLight = new THREE.DirectionalLight(0xa09e5f, 1.5);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(-10, 10, -5);

scene.add(directionalLight);
scene.add(ambientLight);
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0000ff, 1);
document.body.appendChild(renderer.domElement);

let avater = null;
let field = null;
let ready = false;
const gameObject = [];

camera.rotation.x = -1.2;
camera.position.y = 10;
camera.position.z = 5;

const gameController = new GameController();

function animate() {
    gameController.button();
    requestAnimationFrame(animate);
    if (ready) {
        const pos = avater.position.clone();
        gameObject.forEach((o) => o.idle());
        if (avater.position.x < -5) {
            avater.position.x = -5;
        }
        if (avater.position.x > 5) {
            avater.position.x = 5;
        }
        if (avater.position.z < -5) {
            avater.position.z = -5;
        }
        if (avater.position.z > 5) {
            avater.position.z = 5;
        }
        hitObjects = field.containsPoint(avater.position);
        if (hitObjects.length > 0) {
            if (hitObjects[0].obj.geometry) {
                avater.position.copy(pos);
            }
        }
    }
    renderer.render(scene, camera);
}

animate();

const loader = new THREE.GLTFLoader();

const cube = loader.load(
    "glb/object.glb",
    (object) => {
        object.scene.traverse((child) => {
            if (child.name === "avater") {
                avater = new AvaterObject(child.clone());
                avater.position.y = 0.1;
                scene.add(avater.obj);
                gameObject.push(avater);
            }
            if (child.name === "field") {
                field = new FieldObject(child.clone());
                scene.add(field.obj);
                gameObject.push(field);
            }
        });
        ready = true;
    },
    undefined,
    function (error) {
        console.error(error);
    }
);