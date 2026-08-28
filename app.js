document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Handle canvas resize fixes if needed
            if (targetId === 'tab-single' && singleRenderer) {
                singleRenderer.setSize(document.getElementById('canvas-single').clientWidth, document.getElementById('canvas-single').clientHeight);
            }
            if (targetId === 'tab-installation' && instRenderer) {
                instRenderer.setSize(document.getElementById('canvas-installation').clientWidth, document.getElementById('canvas-installation').clientHeight);
            }
            if (targetId === 'tab-iso' && window.isoRenderer) {
                const w = document.getElementById('canvas-iso').clientWidth;
                const h = document.getElementById('canvas-iso').clientHeight;
                window.isoRenderer.setSize(w, h);
                const aspect = w / h;
                const frustumSize = 2500;
                window.isoCamera.left = frustumSize * aspect / -2;
                window.isoCamera.right = frustumSize * aspect / 2;
                window.isoCamera.top = frustumSize / 2;
                window.isoCamera.bottom = frustumSize / -2;
                window.isoCamera.updateProjectionMatrix();
            }
        });
    });

    // --- Global 3D Setup ---
    const clock = new THREE.Clock();
    const timeCallbacks = [];

    // Global Iso Function
    const isoWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    function makeIso(group, edgeColor, depthTest = true) {
        group.traverse(child => {
            if (child.isMesh) {
                child.material = isoWhiteMat;
                const edges = new THREE.EdgesGeometry(child.geometry, 15);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1, depthTest: depthTest }));
                child.add(line);
            }
        });
        return group;
    }

    // --- Tab 1: Single Unit Scene ---
    const singleContainer = document.getElementById('canvas-single');
    const singleScene = new THREE.Scene();
    singleScene.background = new THREE.Color(0xffffff);
    
    const singleCamera = new THREE.PerspectiveCamera(40, singleContainer.clientWidth / singleContainer.clientHeight, 1, 2000);
    singleCamera.position.set(130, 95, 170);
    
    const singleRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    singleRenderer.setSize(singleContainer.clientWidth, singleContainer.clientHeight);
    singleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    singleContainer.appendChild(singleRenderer.domElement);

    const singleControls = new THREE.OrbitControls(singleCamera, singleRenderer.domElement);
    singleControls.enableDamping = true;
    singleControls.dampingFactor = 0.05;

    // Build the unit and add to single scene in Isometric line style
    const singleUnitRaw = window.UmweltUnitBuilder.create(THREE, timeCallbacks);
    const singleUnit = makeIso(singleUnitRaw, 0x00aacc, true);
    singleScene.add(singleUnit);


    // --- Tab 2: Installation Diorama Scene ---
    const instContainer = document.getElementById('canvas-installation');
    const instScene = new THREE.Scene();
    instScene.background = new THREE.Color(0xffffff);

    const aspect = instContainer.clientWidth / instContainer.clientHeight;
    const frustumSize = 2500;
    const instCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        -5000, 10000
    );
    instCamera.position.set(2000, 2000, 2000); 
    
    const instRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    instRenderer.setSize(instContainer.clientWidth, instContainer.clientHeight);
    instRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    instContainer.appendChild(instRenderer.domElement);

    const instControls = new THREE.OrbitControls(instCamera, instRenderer.domElement);
    instControls.enableDamping = true;
    instControls.dampingFactor = 0.05;
    instControls.target.set(0, 0, 0);

    // Wooden Table (2000 x 1000 x 40 mm)
    const tableGeom = new THREE.BoxGeometry(2000, 40, 1000);
    const table = new THREE.Mesh(tableGeom);
    table.position.y = -20; // Top surface at Y=0
    instScene.add(makeIso(table, 0x00cc66));

    // Table Legs
    const legGeom = new THREE.BoxGeometry(60, 760, 60);
    const legPositions = [
        [-900, -400, -400], [900, -400, -400],
        [-900, -400, 400], [900, -400, 400]
    ];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeom);
        leg.position.set(...pos);
        instScene.add(makeIso(leg, 0x00cc66));
    });

    // Central Cable Slot in Table (Visual representation)
    const slotGeom = new THREE.BoxGeometry(1600, 41, 40);
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const slot = new THREE.Mesh(slotGeom, slotMat);
    slot.position.set(0, -20, 0);
    instScene.add(slot);

    // Build 12 Units with varied sensors
    const sensorTypes = ['electro', 'sound', 'light', 'default', 'electro', 'sound', 'light', 'default', 'electro', 'sound', 'light', 'default'];
    const hoseExtMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff, transparent: true, opacity: 0.65, roughness: 0.2, transmission: 0.8, thickness: 2.0
    });

    const xPositions = [-750, -450, -150, 150, 450, 750];
    
    let simProgress = 0;
    let simTarget = 0;
    const interactiveObjects = [];

    const peopleGroup = new THREE.Group();
    instScene.add(peopleGroup);
    
    function createPerson(type, x, z, row) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const height = type === 'child' ? 1200 : (type === 'female' ? 1650 : 1750);
        const radius = type === 'child' ? 120 : (type === 'female' ? 160 : 200);
        
        const bodyGeom = new THREE.CylinderGeometry(radius * 0.8, radius, height - 300, 16);
        const body = new THREE.Mesh(bodyGeom, mat);
        body.position.y = -800 + (height - 300) / 2;
        group.add(body);
        
        const headGeom = new THREE.SphereGeometry(radius * 0.7, 16, 16);
        const head = new THREE.Mesh(headGeom, mat);
        head.position.y = -800 + height - 150;
        group.add(head);

        // Shoulders and Arms
        const shoulderHeight = -800 + height - 250;
        const armLength = height * 0.25; // Shorter arms (bent elbow illusion)
        
        // Arm cylinder pointing along +Z axis so lookAt works properly
        const armGeom = new THREE.CylinderGeometry(radius * 0.15, radius * 0.12, armLength, 8);
        armGeom.rotateX(Math.PI / 2);
        armGeom.translate(0, 0, armLength / 2); 
        
        const handGeom = new THREE.SphereGeometry(radius * 0.15, 8, 8);
        handGeom.translate(0, 0, armLength);
        
        const lShoulder = new THREE.Group();
        lShoulder.position.set(-radius * 0.8, shoulderHeight, 0);
        lShoulder.add(new THREE.Mesh(armGeom, mat));
        lShoulder.add(new THREE.Mesh(handGeom, mat));
        group.add(lShoulder);
        
        const rShoulder = new THREE.Group();
        rShoulder.position.set(radius * 0.8, shoulderHeight, 0);
        rShoulder.add(new THREE.Mesh(armGeom, mat));
        rShoulder.add(new THREE.Mesh(handGeom, mat));
        group.add(rShoulder);

        group.position.set(x, 0, z);
        if (row === 0) group.rotation.y = Math.PI; // Face the table
        
        group.userData = {
            lShoulder, rShoulder, shoulderHeight, armLength, radius, height, row
        };
        
        return makeIso(group, 0x00cc66);
    }

    // Active indices for people (70% of 12 is ~8)
    const activeIndices = [0, 1, 3, 5, 7, 8, 9, 11];

    for(let row = 0; row < 2; row++) {
        for(let col = 0; col < 6; col++) {
            const idx = row * 6 + col;
            const unit = window.UmweltUnitBuilder.create(THREE, timeCallbacks, sensorTypes[idx]);
            const posX = xPositions[col];
            const posZ = row === 0 ? 300 : -300; 
            
            unit.position.set(posX, 5.3, posZ);
            unit.rotation.x = -Math.PI / 2;
            if (row === 1) unit.rotation.z = Math.PI; 
            
            unit.updateMatrixWorld(true);
            const isoUnit = makeIso(unit, 0x00aacc);
            instScene.add(isoUnit);

            const hoseExitLocal = new THREE.Vector3(-25, -47.5, 11.5);
            const hoseExitWorld = hoseExitLocal.clone().applyMatrix4(unit.matrixWorld);
            const slotEntryX = posX;
            const slotEntryZ = row === 0 ? 20 : -20;
            
            const routePath = new THREE.CatmullRomCurve3([
                hoseExitWorld,
                new THREE.Vector3(hoseExitWorld.x, 3.5, hoseExitWorld.z + (row === 0 ? -40 : 40)),
                new THREE.Vector3(slotEntryX, 3.5, slotEntryZ),
                new THREE.Vector3(slotEntryX, -40, 0),
                new THREE.Vector3(posX * 0.2, -350, 0),
                new THREE.Vector3(0, -450, 0)
            ]);
            const routeMesh = new THREE.Mesh(new THREE.TubeGeometry(routePath, 32, 3.5, 8, false));
            instScene.add(makeIso(routeMesh, 0x00aacc));
            
            let personObj = null;
            if (activeIndices.includes(idx)) {
                const pType = idx % 3 === 0 ? 'child' : (idx % 2 === 0 ? 'female' : 'male');
                const pZ = row === 0 ? 1500 : -1500; // Start far away
                personObj = createPerson(pType, posX, pZ, row);
                // Calculate ideal standing distance based on arm length so hands can reach the device
                const L = personObj.userData.armLength;
                const dy = L * 0.4; 
                const dz = Math.sqrt(L*L - dy*dy);
                // The person's center is at Z. Table edge is 500. We want device at posZ (300).
                // Hands will be at person Z - dz. We want hands to be at posZ.
                // So person Z = posZ + dz.
                personObj.userData.endZ = row === 0 ? posZ + dz : posZ - dz;
                peopleGroup.add(personObj);
            }

            interactiveObjects.push({ 
                idx, unit: isoUnit, person: personObj, 
                baseZ: posZ, posX, row, routeMesh 
            });
        }
    }

    // Power Box (Under Table)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, -500, 0);

    const boxEnclosure = new THREE.Mesh(new THREE.BoxGeometry(400, 200, 150));
    boxGroup.add(boxEnclosure);

    const psMesh = new THREE.Mesh(new THREE.BoxGeometry(160, 80, 40));
    psMesh.position.set(-80, 0, -30);
    boxGroup.add(psMesh);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(360, 15, 10));
    rail.position.set(0, -40, 30);
    boxGroup.add(rail);

    const breaker = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 50));
    breaker.position.set(-140, -40, 40);
    boxGroup.add(breaker);

    for(let i=0; i<12; i++) {
        const fuse = new THREE.Mesh(new THREE.BoxGeometry(15, 40, 40));
        fuse.position.set(-80 + i * 18, -40, 40);
        boxGroup.add(fuse);
    }
    
    instScene.add(makeIso(boxGroup, 0x00cc66));
    
    // Room Simulation Toggle
    const roomLightsGroup = new THREE.Group();
    roomLightsGroup.visible = false;
    
    // Add warm gallery spotlights above the table
    const spot1 = new THREE.SpotLight(0xffedd5, 0);
    spot1.position.set(-500, 2000, 0);
    spot1.angle = Math.PI / 4;
    spot1.penumbra = 0.5;
    roomLightsGroup.add(spot1);
    
    const spot2 = new THREE.SpotLight(0xffedd5, 0);
    spot2.position.set(500, 2000, 0);
    spot2.angle = Math.PI / 4;
    spot2.penumbra = 0.5;
    roomLightsGroup.add(spot2);
    
    instScene.add(roomLightsGroup);

    let simActive = false;
    const btnSim = document.getElementById('btn-sim-room');
    if (btnSim) {
        btnSim.addEventListener('click', () => {
            simActive = !simActive;
            simTarget = simActive ? 1 : 0;
            roomLightsGroup.visible = true; // Always visible, intensity animates
            
            if (simActive) {
                btnSim.textContent = "Deshabitar";
                btnSim.classList.add('active');
            } else {
                btnSim.textContent = "Habitar";
                btnSim.classList.remove('active');
            }
        });
    }



    // --- Animation Loop ---
    window.addEventListener('resize', () => {
        singleCamera.aspect = singleContainer.clientWidth / singleContainer.clientHeight;
        singleCamera.updateProjectionMatrix();
        singleRenderer.setSize(singleContainer.clientWidth, singleContainer.clientHeight);

        instCamera.aspect = instContainer.clientWidth / instContainer.clientHeight;
        instCamera.updateProjectionMatrix();
        instRenderer.setSize(instContainer.clientWidth, instContainer.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Smoothly update simulation progress (SLOWER)
        simProgress += (simTarget - simProgress) * 0.015;

        // Animate Interactive Objects
        interactiveObjects.forEach(obj => {
            if (!obj.person) return;
            
            const startZ = obj.row === 0 ? 1500 : -1500;
            const endZ = obj.person.userData.endZ;
            
            // Walk phase (0 to 0.7)
            const walkP = Math.min(1, simProgress / 0.7); 
            obj.person.position.z = startZ + (endZ - startZ) * walkP;
            
            const lShoulder = obj.person.userData.lShoulder;
            const rShoulder = obj.person.userData.rShoulder;
            const radius = obj.person.userData.radius;
            
            const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, obj.row === 1 ? Math.PI : 0));
            
            if (simProgress < 0.7) {
                // Swinging arms while walking
                const swing = Math.sin(time * 6) * 300 * walkP;
                const walkTargetL = new THREE.Vector3(-radius * 0.8, -1000, swing);
                const walkTargetR = new THREE.Vector3(radius * 0.8, -1000, -swing);
                
                lShoulder.lookAt(obj.person.localToWorld(walkTargetL));
                rShoulder.lookAt(obj.person.localToWorld(walkTargetR));
                
                // Device stays on table
                obj.unit.position.y = 5.3;
                obj.unit.position.z = obj.baseZ;
                obj.unit.quaternion.copy(startQuat);
            } else {
                // Lift phase (0.7 to 1.0)
                const pickP = (simProgress - 0.7) / 0.3; 
                
                const L = obj.person.userData.armLength;
                const dy = L * 0.4;
                const targetDeviceY = obj.person.userData.shoulderHeight - dy;
                
                // Device lifts straight up since person Z was calculated to match!
                obj.unit.position.y = 5.3 + (targetDeviceY - 5.3) * pickP;
                obj.unit.position.z = obj.baseZ; 
                
                // Device faces person naturally
                const headTargetWorld = obj.person.localToWorld(new THREE.Vector3(0, obj.person.userData.height - 150, 0));
                const dummy = new THREE.Object3D();
                dummy.position.copy(obj.unit.position);
                dummy.lookAt(headTargetWorld);
                obj.unit.quaternion.copy(startQuat).slerp(dummy.quaternion, pickP);
                
                obj.unit.updateMatrixWorld(true);
                
                // Animate arms looking at a point naturally in front of the person
                const grabTargetL = obj.person.localToWorld(new THREE.Vector3(-60, 0, L * 0.9));
                const grabTargetR = obj.person.localToWorld(new THREE.Vector3(60, 0, L * 0.9));
                
                // Interpolate from walking pose to grabbing pose for smoothness
                const walkTargetL = obj.person.localToWorld(new THREE.Vector3(-radius * 0.8, -1000, 0));
                const walkTargetR = obj.person.localToWorld(new THREE.Vector3(radius * 0.8, -1000, 0));
                
                lShoulder.lookAt(walkTargetL.lerp(grabTargetL, pickP));
                rShoulder.lookAt(walkTargetR.lerp(grabTargetR, pickP));
            }
            
            // Rebuild hose if unit moved
            if (simProgress > 0) {
                obj.unit.updateMatrixWorld(true);
                const hoseExitLocal = new THREE.Vector3(-25, -47.5, 11.5);
                const hoseExitWorld = hoseExitLocal.clone().applyMatrix4(obj.unit.matrixWorld);
                
                const slotEntryX = obj.posX;
                const slotEntryZ = obj.row === 0 ? 20 : -20;
                
                // Gravity droop logic
                const liftProgress = Math.max(0, (simProgress - 0.7) / 0.3);
                const dropDist = 150 * liftProgress; // Drops more when lifted
                const droopY = Math.max(3.5, hoseExitWorld.y - dropDist);
                const midZ = (hoseExitWorld.z + slotEntryZ) / 2;
                
                const p0 = hoseExitWorld;
                const p1 = new THREE.Vector3(hoseExitWorld.x, droopY, hoseExitWorld.z + (obj.row === 0 ? -20 : 20));
                const p2 = new THREE.Vector3(hoseExitWorld.x, 3.5, midZ);
                const p3 = new THREE.Vector3(slotEntryX, 3.5, slotEntryZ);
                const p4 = new THREE.Vector3(slotEntryX, -40, 0);
                const p5 = new THREE.Vector3(slotEntryX * 0.2, -350, 0);
                const p6 = new THREE.Vector3(0, -450, 0);
                
                const routePath = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, p5, p6]);
                obj.routeMesh.geometry.dispose();
                obj.routeMesh.geometry = new THREE.TubeGeometry(routePath, 32, 3.5, 8, false);
            }
        });

        // Update animated textures/callbacks
        timeCallbacks.forEach(cb => cb(time));

        // Render visible scene
        const activeTab = document.querySelector('.tab-content.active').id;
        
        if (activeTab === 'tab-single') {
            singleControls.update();
            singleRenderer.render(singleScene, singleCamera);
        } else if (activeTab === 'tab-installation') {
            instControls.update();
            instRenderer.render(instScene, instCamera);
        }
    }

    animate();
});
