//helpers
function dec2hex(i) {
    var result = "0x";
    result = result + i.slice(1);
    return result;
}

function randint(min, max) {
    return Math.floor(Math.random() * max) + min;
}

function delta(ax, ay, az, bx, by, bz) {
    steps_number = Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az));
    stepx = parseFloat(bx - ax) / steps_number;
    stepy = parseFloat(by - ay) / steps_number;
    stepz = parseFloat(bz - az) / steps_number;
    return {
        x: stepx,
        y: stepy,
        z: stepz
    };
}

function rotateAround(point, center, angle) {
    angle = (angle) * (Math.PI / 180); // Convert to radians
    var rotatedX = Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.y - center.y) + center.x;
    var rotatedY = Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.y - center.y) + center.y;
    return {
        x: rotatedX,
        y: rotatedY
    };
}

var WATER_DEPTH = 96,
    WAVE_HEIGHT = 1,
    WAVE_SPEED = 400,
    WATER_COLOR = '#28589e',
    INTERSECTED;

var rootElement,
    scene,
    camera,
    mouse,
    raycaster,
    lookAt,
    renderer,
    orbitControls,
    markers;

var space,
    spaceCenter,
    starQty,
    stars,
    stardust,
    light,
    earth,
    clouds,
    water;
// sphere;
// let camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1500);

// Marker Proto
var markerProto = {
    latLongToVector3: function latLongToVector3(latitude, longitude, radius, height) {
        var phi = (latitude) * Math.PI / 180;
        var theta = (longitude - 180) * Math.PI / 180;

        var x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
        var y = (radius + height) * Math.sin(phi);
        var z = (radius + height) * Math.cos(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
    },
    marker: function marker(size, color, vector3Position) {
        var markerGeometry = new THREE.SphereBufferGeometry(size);
        var markerMaterial = new THREE.MeshLambertMaterial({
            color: color
        });
        var markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
        markerMesh.position.copy(vector3Position);

        return markerMesh;
    }
};


function initRootElement() {
    rootElement = $('#viewer');
}

function initScene() {
    scene = new THREE.Scene();
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(45, rootElement.innerWidth() / rootElement.innerHeight(), 0.1, 100000);
    camera.position.z = 300;
    // projector = new THREE.Projector();
    lookAt = new THREE.Vector3(1, 0, 0);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0);
}


function initRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(rootElement.innerWidth(), rootElement.innerHeight());
    rootElement.append(renderer.domElement);
}

function initOrbitControls() {
    orbitControls = new THREE.OrbitControls(camera);
    orbitControls.enableZoom = false;
}

function onWindowResize() {
    camera.aspect = rootElement.innerWidth() / rootElement.innerHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(rootElement.innerWidth(), rootElement.innerHeight());
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    // raycaster.set( camera.position, mouse.sub( camera.position ).normalize() );
    // console.log(raycaster);
    var intersects = raycaster.intersectObjects(markers);
    if (intersects.length > 0) {
        // console.log(intersects[0]);
        window.location.hash = intersects[0].object.userData.URL;
        intersects[0].object.color = 'yellow';
    }
    // mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function initEarth() {
    clouds = [];
    water = {};
    createWater();
    for (var i = 0; i < randint(16, 32); i++) {
        loader = new THREE.JSONLoader();
        loader.load('models/cloud.json', addCloud);
        // clouds.push(createCloud());
    }
    loader = new THREE.JSONLoader();
    loader.load('models/low_poly_earth.json', function(geometry, materials) {
        earth = new THREE.Mesh(geometry, materials);
        console.log(earth);
        earth.scale.set(10, 10, 10);
        scene.add(earth);
    });

}

function createWater() {
    water.geometry = new THREE.TetrahedronGeometry(WATER_DEPTH, 4);
    water.verVars = [];
    for (var i = 0; i < water.geometry.vertices.length; i++) {
        var v = water.geometry.vertices[i];
        var verVars = {};
        verVars.delta = 0;
        verVars.nextChange = 0;
        water.verVars.push(verVars);
    }
    water.material = new THREE.MeshLambertMaterial({
        color: WATER_COLOR
    });
    water.Mesh = new THREE.Mesh(water.geometry, water.material);
    scene.add(water.Mesh);
}

function initSpace() {
    starQty = 3000;
    stars = new THREE.Geometry();
    stardust = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 40
    });
    spaceCenter = new THREE.Vector3(0, 0, 0);

    for (var i = 0; i < starQty; i++) {
        var px, py, pz;
        px = randint(3000, 3000);
        var p = {
            x: px,
            y: 0
        };
        var c = {
            x: 0,
            y: 0
        };
        r = rotateAround(p, c, randint(0, 360));
        px = r.x;
        py = r.y;
        p.x = px;
        r = rotateAround(p, c, randint(0, 360));
        px = r.x;
        pz = r.y;
        var part = new THREE.Vector3(px, py, pz);
        stars.vertices.push(part);
    }
    space = new THREE.Points(stars, stardust);
    scene.add(space);

    light = new THREE.HemisphereLight(0xffffff, 1);
    // light.position.set(1, 1, 1).normalize();
    scene.add(light);
}

function addCloud(geometry, materials) {
    gr = {};
    gr.geometry = geometry;
    gr.material = materials;
    gr.sphere = new THREE.Mesh(geometry, materials);
    scene.add(gr.sphere);
    gr.sphere.scale.z = randint(20, 25)/3;
    gr.sphere.scale.y = randint(50, 50)/3;
    gr.sphere.scale.x = randint(50, 50)/3;
    gr.sphere.position.x = randint(100, 50);
    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.x,
        y: gr.sphere.position.y
    };
    center = {
        x: 0,
        y: 0
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.position.x = r.x;
    gr.sphere.position.y = r.y;
    gr.sphere.rotation.z = randRotate * Math.PI / 180;

    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.y,
        y: gr.sphere.position.z
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.rotation.x = randRotate * Math.PI / 180;
    gr.sphere.position.y = r.x;
    gr.sphere.position.z = r.y;
    gr.rx = randint(-5, 20) / 100;
    gr.ry = randint(-5, 20) / 100;
    gr.rz = randint(-5, 15) / 100;
    center = {
        x: 0,
        y: 0
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.position.x = r.x;
    gr.sphere.position.y = r.y;
    gr.sphere.rotation.z = randRotate * Math.PI / 180;

    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.y,
        y: gr.sphere.position.z
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.rotation.x = randRotate * Math.PI / 180;
    gr.sphere.position.y = r.x;
    gr.sphere.position.z = r.y;
    gr.rx = randint(-5, 20) / 100;
    gr.ry = randint(-5, 20) / 100;
    gr.rz = randint(-5, 15) / 100;
    clouds.push(gr);
}


function createCloud() {
    gr = {};
    gr.geometry = new THREE.SphereBufferGeometry(50, 10, 10);
    gr.material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    gr.sphere = new THREE.Mesh(gr.geometry, gr.material);
    scene.add(gr.sphere);
    gr.sphere.scale.z = randint(20, 25) / 100;
    gr.sphere.scale.y = randint(50, 50) / 100;
    gr.sphere.scale.x = randint(50, 50) / 100;
    gr.sphere.position.x = randint(110, 50);
    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.x,
        y: gr.sphere.position.y
    };    gr.geometry = new THREE.SphereBufferGeometry(50, 10, 10);
    gr.material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    gr.sphere = new THREE.Mesh(gr.geometry, gr.material);
    scene.add(gr.sphere);
    gr.sphere.scale.z = randint(20, 25) / 100;
    gr.sphere.scale.y = randint(50, 50) / 100;
    gr.sphere.scale.x = randint(50, 50) / 100;
    gr.sphere.position.x = randint(110, 50);
    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.x,
        y: gr.sphere.position.y
    };
    center = {
        x: 0,
        y: 0
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.position.x = r.x;
    gr.sphere.position.y = r.y;
    gr.sphere.rotation.z = randRotate * Math.PI / 180;

    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.y,
        y: gr.sphere.position.z
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.rotation.x = randRotate * Math.PI / 180;
    gr.sphere.position.y = r.x;
    gr.sphere.position.z = r.y;
    gr.rx = randint(-10, 20) / 100;
    gr.ry = randint(-10, 20) / 100;
    gr.rz = randint(-10, 20) / 100;
    center = {
        x: 0,
        y: 0
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.position.x = r.x;
    gr.sphere.position.y = r.y;
    gr.sphere.rotation.z = randRotate * Math.PI / 180;

    randRotate = randint(0, 360);
    point = {
        x: gr.sphere.position.y,
        y: gr.sphere.position.z
    };
    r = rotateAround(point, center, randRotate);
    gr.sphere.rotation.x = randRotate * Math.PI / 180;
    gr.sphere.position.y = r.x;
    gr.sphere.position.z = r.y;
    gr.rx = randint(-10, 20) / 100;
    gr.ry = randint(-10, 20) / 100;
    gr.rz = randint(-10, 20) / 100;
    return gr;
}

function animateClouds() {
    for (i = 0; i < clouds.length; i++) {
        cloud = clouds[i];
        center = {
            x: 0,
            y: 0
        };
        cloudX = cloud.sphere.position.x;
        cloudY = cloud.sphere.position.y;
        cloudZ = cloud.sphere.position.z;
        point = {
            x: cloudX,
            y: cloudY
        };
        newPos = rotateAround(point, center, cloud.rz);
        cloudX = newPos.x;
        cloudY = newPos.y;
        point = {
            x: cloudX,
            y: cloudZ
        };
        newPos = rotateAround(point, center, cloud.ry);
        cloudX = newPos.x;
        cloudZ = newPos.y;
        point = {
            x: cloudY,
            y: cloudZ
        };
        newPos = rotateAround(point, center, cloud.rx);
        cloudY = newPos.x;
        cloudZ = newPos.y;

        cloud.sphere.position.x = cloudX;
        cloud.sphere.position.y = cloudY;
        cloud.sphere.position.z = cloudZ;

        cloud.sphere.lookAt(spaceCenter);
    }
}

function animateWater() {
    for (i = 0; i < water.Mesh.geometry.vertices.length; i++) {
        var v = water.Mesh.geometry.vertices[i];
        var verVars = water.verVars[i];
        verVars.nextChange -= 1;
        if (verVars.nextChange < 0) {
            verVars.delta = randint(-10, 20) / WAVE_SPEED;
            verVars.nextChange = randint(20, 50);
        }
        if (v.distanceTo(spaceCenter) > WATER_DEPTH + WAVE_HEIGHT) {
            verVars.delta = randint(-10, 10) / WAVE_SPEED;
        }
        if (v.distanceTo(spaceCenter) < WATER_DEPTH - WAVE_HEIGHT) {
            verVars.delta = randint(0, 10) / WAVE_SPEED;
        }
        d = delta(0, 0, 0, v.x, v.y, v.z);
        v.x += d.x * verVars.delta;
        v.y += d.y * verVars.delta;
        v.z += d.z * verVars.delta;
    }
    water.Mesh.geometry.verticesNeedUpdate = true;
    water.Mesh.geometry.dynamic = true;
}

function initMarkers() {
    markers = [];
    var MARKER_SIZE = 8;
    var galapagos = markerProto.latLongToVector3(-38, -91, 51, 51);
    var obj = markerProto.marker(MARKER_SIZE, 'red', galapagos);
    obj.userData = {
        URL: "#Galapagos"
    };
    scene.add(obj);
    markers.push(obj);
    var maldivas = markerProto.latLongToVector3(-20, 78, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', maldivas);
    obj.userData = {
        URL: "#Maldivas"
    };
    scene.add(obj);
    markers.push(obj);
    var barreiracoral = markerProto.latLongToVector3(-65, 145, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', barreiracoral);
    obj.userData = {
        URL: "#BarreiraDeCoral"
    };
    scene.add(obj);
    markers.push(obj);
    var veneza = markerProto.latLongToVector3(45.43, 12.33, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', veneza);
    obj.userData = {
        URL: "#Veneza"
    };
    scene.add(obj);
    markers.push(obj);
    var marmorto = markerProto.latLongToVector3(19, 55, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', marmorto);
    obj.userData = {
        URL: "#MarMorto"
    };
    scene.add(obj);
    markers.push(obj);
    var alpes = markerProto.latLongToVector3(54, 9, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', alpes);
    obj.userData = {
        URL: "#Alpes"
    };
    scene.add(obj);
    markers.push(obj);
    var madagascar = markerProto.latLongToVector3(-19.125, 46.812, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', madagascar);
    obj.userData = {
        URL: "#Madagascar"
    };
    scene.add(obj);
    markers.push(obj);
    var congo = markerProto.latLongToVector3(1, 23, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', congo);
    obj.userData = {
        URL: "#BaciaDoCongo"
    };
    scene.add(obj);
    markers.push(obj);
    var geleiras = markerProto.latLongToVector3(80, 24.51, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', geleiras);
    obj.userData = {
        URL: "#Geleiras"
    };
    scene.add(obj);
    markers.push(obj);
    var tajmahal = markerProto.latLongToVector3(13, 90.8, 51, 51);
    obj = markerProto.marker(MARKER_SIZE, 'red', tajmahal);
    obj.userData = {
        URL: "#TajMahal"
    };
    scene.add(obj);
    markers.push(obj);
}

function init() {
    initRootElement();
    initScene();
    initCamera();
    initRenderer();
    initOrbitControls();
    initSpace();
    initEarth();
    initMarkers();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    animateClouds();
    animateWater();
    camera.lookAt(lookAt);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(markers);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED)
                INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);

        }
    } else {

        if (INTERSECTED)
            INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
    render();
}

init();
animate();
