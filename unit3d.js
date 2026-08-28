window.UmweltUnitBuilder = {
    create: function(THREE, timeCallbackArray, sensorType = 'default') {
        const mainAssemblyGroup = new THREE.Group();
        // ... (keep materials and setup)
        
        const coverGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0x7dd3fc,
            emissive: 0x0c4a6e,
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.55,
            roughness: 0.08,
            transmission: 0.65,
            ior: 1.49,
            reflectivity: 0.7,
            clearcoat: 1.0,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const varillaMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.82,
            roughness: 0.12,
            transmission: 0.35,
            ior: 1.52,
            reflectivity: 0.85,
            clearcoat: 1.0,
            side: THREE.DoubleSide,
            depthWrite: true
        });

        const varillaEdgeMat = new THREE.LineBasicMaterial({
            color: 0x7dd3fc,
            linewidth: 1.5,
            transparent: true,
            opacity: 0.95
        });

        const perfboardMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.55, metalness: 0.15 });
        const pcbPurpleMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.35, metalness: 0.2 });
        const pcbBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.35, metalness: 0.2 });
        const pcbRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.1 });
        const securityScrewMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.2 });
        const textileSleeveMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });

        // Screen Texture (Animated)
        const screenCanvas = document.createElement('canvas');
        screenCanvas.width = 512; screenCanvas.height = 680;
        const screenCtx = screenCanvas.getContext('2d');
        const screenTexture = new THREE.CanvasTexture(screenCanvas);

        if (timeCallbackArray) {
            timeCallbackArray.push((time) => {
                screenCtx.fillStyle = '#050b14';
                screenCtx.fillRect(0, 0, 512, 680);
                screenCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
                screenCtx.lineWidth = 1;
                for (let x = 0; x < 512; x += 32) {
                    screenCtx.beginPath(); screenCtx.moveTo(x, 0); screenCtx.lineTo(x, 680); screenCtx.stroke();
                }
                for (let y = 0; y < 680; y += 32) {
                    screenCtx.beginPath(); screenCtx.moveTo(0, y); screenCtx.lineTo(512, y); screenCtx.stroke();
                }
                screenCtx.fillStyle = '#38bdf8';
                screenCtx.font = 'bold 22px "JetBrains Mono", monospace';
                screenCtx.fillText('TFT 2.0" ST7789 LANDSCAPE', 32, 48);

                screenCtx.lineWidth = 3;
                screenCtx.strokeStyle = '#10b981';
                screenCtx.beginPath();
                for (let x = 20; x < 492; x += 4) {
                    const y = 300 + Math.sin((x * 0.03) + (time * 3.5)) * 45;
                    if (x === 20) screenCtx.moveTo(x, y);
                    else screenCtx.lineTo(x, y);
                }
                screenCtx.stroke();

                for (let i = 0; i < 16; i++) {
                    const bH = 30 + Math.abs(Math.sin(time * 4.0 + i * 0.4)) * 140;
                    screenCtx.fillStyle = `hsl(${190 + i * 8}, 95%, 55%)`;
                    screenCtx.fillRect(40 + i * 28, 600 - bH, 22, bH);
                }
                screenTexture.needsUpdate = true;
            });
        }
        const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });

        // Build groups
        const frontCoverGroup = new THREE.Group();
        const backCoverGroup = new THREE.Group();
        const varillasGroup = new THREE.Group();
        const perfboardGroup = new THREE.Group();
        const frontElectronicsGroup = new THREE.Group();
        const frontScrewGroup = new THREE.Group();
        const backScrewGroup = new THREE.Group();
        const powerCableGroup = new THREE.Group();

        mainAssemblyGroup.add(frontCoverGroup);
        mainAssemblyGroup.add(backCoverGroup);
        mainAssemblyGroup.add(varillasGroup);
        mainAssemblyGroup.add(perfboardGroup);
        mainAssemblyGroup.add(frontElectronicsGroup);
        mainAssemblyGroup.add(frontScrewGroup);
        mainAssemblyGroup.add(backScrewGroup);
        mainAssemblyGroup.add(powerCableGroup);
        
        mainAssemblyGroup.userData = {
            varillasGroup, frontCoverGroup, backCoverGroup
        };

        const buildCovers = () => {
            const outW = 72.0; const outH = 91.0;
            const w2 = outW / 2; const h2 = outH / 2; const r = 5.0;

            const fShape = new THREE.Shape();
            fShape.moveTo(-w2 + r, -h2);
            fShape.lineTo(w2 - r, -h2);
            fShape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
            fShape.lineTo(w2, h2 - r);
            fShape.quadraticCurveTo(w2, h2, w2 - r, h2);
            fShape.lineTo(-w2 + r, h2);
            fShape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
            fShape.lineTo(-w2, -h2 + r);
            fShape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);

            const scrCut = new THREE.Path();
            const winX = 1.57; const winY = 16.70;
            const wX = 21.5; const wY = 16.3;
            scrCut.moveTo(winX - wX, winY + wY);
            scrCut.lineTo(winX + wX, winY + wY);
            scrCut.lineTo(winX + wX, winY - wY);
            scrCut.lineTo(winX - wX, winY - wY);
            scrCut.lineTo(winX - wX, winY + wY);
            fShape.holes.push(scrCut);

            const senCut = new THREE.Path();
            const senCx = 11.91, senCy = -20.99, senHalf = 6.35;
            senCut.moveTo(senCx - senHalf, senCy + senHalf);
            senCut.lineTo(senCx + senHalf, senCy + senHalf);
            senCut.lineTo(senCx + senHalf, senCy - senHalf);
            senCut.lineTo(senCx - senHalf, senCy - senHalf);
            senCut.closePath();
            fShape.holes.push(senCut);

            const sX = 31.0; const sY = 40.5;
            [[-sX, sY], [sX, sY], [-sX, -sY], [sX, -sY]].forEach(([cx, cy]) => {
                const sp = new THREE.Path();
                for (let i = 0; i <= 16; i++) {
                    const theta = - (i / 16) * Math.PI * 2;
                    const x = cx + Math.cos(theta) * 1.6;
                    const y = cy + Math.sin(theta) * 1.6;
                    if (i === 0) sp.moveTo(x, y);
                    else sp.lineTo(x, y);
                }
                sp.closePath();
                fShape.holes.push(sp);
            });

            const fGeom = new THREE.ExtrudeGeometry(fShape, { depth: 3.0, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25 });
            fGeom.center();
            const fMesh = new THREE.Mesh(fGeom, coverGlassMat);
            frontCoverGroup.position.z = 17.3;
            frontCoverGroup.add(fMesh);

            const bShape = new THREE.Shape();
            bShape.moveTo(-w2 + r, -h2);
            bShape.lineTo(w2 - r, -h2);
            bShape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
            bShape.lineTo(w2, h2 - r);
            bShape.quadraticCurveTo(w2, h2, w2 - r, h2);
            bShape.lineTo(-w2 + r, h2);
            bShape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
            bShape.lineTo(-w2, -h2 + r);
            bShape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);

            [[-sX, sY], [sX, sY], [-sX, -sY], [sX, -sY]].forEach(([cx, cy]) => {
                const sp = new THREE.Path();
                for (let i = 0; i <= 16; i++) {
                    const theta = - (i / 16) * Math.PI * 2;
                    const x = cx + Math.cos(theta) * 1.6;
                    const y = cy + Math.sin(theta) * 1.6;
                    if (i === 0) sp.moveTo(x, y);
                    else sp.lineTo(x, y);
                }
                sp.closePath();
                bShape.holes.push(sp);
            });

            const bGeom = new THREE.ExtrudeGeometry(bShape, { depth: 3.0, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25 });
            bGeom.center();
            const bMesh = new THREE.Mesh(bGeom, coverGlassMat);
            backCoverGroup.position.z = -5.3;
            backCoverGroup.add(bMesh);
        };

        const buildPerforatedVarillas = () => {
            const sX = 31.0; const sY = 40.5; const r = 5.0;
            const sw = 72.0; const sh = 8.0;
            const sw2 = sw / 2; const sh2 = sh / 2; const sr = 4.0;

            const shortShape = new THREE.Shape();
            shortShape.moveTo(-sw2 + sr, -sh2);
            shortShape.lineTo(sw2 - sr, -sh2);
            shortShape.quadraticCurveTo(sw2, -sh2, sw2, -sh2 + sr);
            shortShape.lineTo(sw2, sh2 - sr);
            shortShape.quadraticCurveTo(sw2, sh2, sw2 - sr, sh2);
            shortShape.lineTo(-sw2 + sr, sh2);
            shortShape.quadraticCurveTo(-sw2, sh2, -sw2, sh2 - sr);
            shortShape.lineTo(-sw2, -sh2 + sr);
            shortShape.quadraticCurveTo(-sw2, -sh2, -sw2 + sr, -sh2);

            [-sX, sX].forEach(hx => {
                const sp = new THREE.Path();
                for (let i = 0; i <= 16; i++) {
                    const theta = - (i / 16) * Math.PI * 2;
                    const x = hx + Math.cos(theta) * 1.6;
                    const y = Math.sin(theta) * 1.6;
                    if (i === 0) sp.moveTo(x, y);
                    else sp.lineTo(x, y);
                }
                sp.closePath();
                shortShape.holes.push(sp);
            });

            const shortGeom = new THREE.ExtrudeGeometry(shortShape, { depth: 3.0, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15 });
            shortGeom.center();
            const shortEdges = new THREE.EdgesGeometry(shortGeom, 25);

            const leftLongShape = new THREE.Shape();
            leftLongShape.moveTo(-r, -sY);
            leftLongShape.lineTo(-r, sY);
            leftLongShape.absarc(0, sY, r, Math.PI, Math.PI / 2, true);
            leftLongShape.absarc(0, sY, r, Math.PI / 2, -Math.PI / 2, true);
            leftLongShape.lineTo(0, -sY + r);
            leftLongShape.absarc(0, -sY, r, Math.PI / 2, -Math.PI / 2, true);
            leftLongShape.absarc(0, -sY, r, -Math.PI / 2, -Math.PI, true);

            [-sY, sY].forEach(hy => {
                const sp = new THREE.Path();
                for (let i = 0; i <= 16; i++) {
                    const theta = - (i / 16) * Math.PI * 2;
                    const x = Math.cos(theta) * 1.6;
                    const y = hy + Math.sin(theta) * 1.6;
                    if (i === 0) sp.moveTo(x, y);
                    else sp.lineTo(x, y);
                }
                sp.closePath();
                leftLongShape.holes.push(sp);
            });

            const rightLongShape = new THREE.Shape();
            rightLongShape.moveTo(r, -sY);
            rightLongShape.lineTo(r, sY);
            rightLongShape.absarc(0, sY, r, 0, Math.PI / 2, false);
            rightLongShape.absarc(0, sY, r, Math.PI / 2, 3 * Math.PI / 2, false);
            rightLongShape.lineTo(0, -sY + r);
            rightLongShape.absarc(0, -sY, r, Math.PI / 2, 3 * Math.PI / 2, false);
            rightLongShape.absarc(0, -sY, r, 3 * Math.PI / 2, 2 * Math.PI, false);

            [-sY, sY].forEach(hy => {
                const sp = new THREE.Path();
                for (let i = 0; i <= 16; i++) {
                    const theta = - (i / 16) * Math.PI * 2;
                    const x = Math.cos(theta) * 1.6;
                    const y = hy + Math.sin(theta) * 1.6;
                    if (i === 0) sp.moveTo(x, y);
                    else sp.lineTo(x, y);
                }
                sp.closePath();
                rightLongShape.holes.push(sp);
            });

            const leftLongGeom = new THREE.ExtrudeGeometry(leftLongShape, { depth: 3.0, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15 });
            leftLongGeom.center();
            const leftLongEdges = new THREE.EdgesGeometry(leftLongGeom, 25);

            const rightLongGeom = new THREE.ExtrudeGeometry(rightLongShape, { depth: 3.0, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15 });
            rightLongGeom.center();
            const rightLongEdges = new THREE.EdgesGeometry(rightLongGeom, 25);

            function addHorizontalLayer(zPos) {
                const vTop = new THREE.Mesh(shortGeom, varillaMat);
                vTop.position.set(0, sY, zPos);
                vTop.add(new THREE.LineSegments(shortEdges, varillaEdgeMat));
                varillasGroup.add(vTop);

                const vBot = new THREE.Mesh(shortGeom, varillaMat);
                vBot.position.set(0, -sY, zPos);
                vBot.add(new THREE.LineSegments(shortEdges, varillaEdgeMat));
                varillasGroup.add(vBot);
            }

            function addLateralLayer(zPos) {
                const vLeft = new THREE.Mesh(leftLongGeom, varillaMat);
                vLeft.position.set(-sX, 0, zPos);
                vLeft.add(new THREE.LineSegments(leftLongEdges, varillaEdgeMat));
                varillasGroup.add(vLeft);

                const vRight = new THREE.Mesh(rightLongGeom, varillaMat);
                vRight.position.set(sX, 0, zPos);
                vRight.add(new THREE.LineSegments(rightLongEdges, varillaEdgeMat));
                varillasGroup.add(vRight);
            }

            addHorizontalLayer(2.3);
            addLateralLayer(5.3);
            addHorizontalLayer(8.3);
            addLateralLayer(11.3);
            addHorizontalLayer(14.3);
            addLateralLayer(-2.3);
        };

        const buildPerfboardAndElectronics = () => {
            const perfCanvas = document.createElement('canvas');
            perfCanvas.width = 1024; perfCanvas.height = 1341;
            const pCtx = perfCanvas.getContext('2d');
            pCtx.fillStyle = '#15803d'; pCtx.fillRect(0, 0, perfCanvas.width, perfCanvas.height);
            
            const pxPerMmX = perfCanvas.width / 69.5;
            const pxPerMmY = perfCanvas.height / 91.0;
            const cx = perfCanvas.width / 2;
            const cy = perfCanvas.height / 2;
            pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
            const colNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            for(let c = 0; c < 24; c++) {
                const x_mm = -30.0 + c * 2.54;
                const x_px = cx + x_mm * pxPerMmX;
                const letter = colNames[c];
                pCtx.fillStyle = '#ffffff'; pCtx.font = 'bold 24px Arial';
                pCtx.fillText(letter, x_px, cy - 43.0 * pxPerMmY);
                pCtx.fillText(letter, x_px, cy + 43.0 * pxPerMmY);
                for(let r = 1; r <= 32; r++) {
                    const y_mm = 26.0 - (26 - r) * 2.54;
                    const y_px = cy - y_mm * pxPerMmY;
                    pCtx.fillStyle = '#d4af37'; pCtx.beginPath();
                    pCtx.arc(x_px, y_px, 1.0 * pxPerMmX, 0, Math.PI * 2); pCtx.fill();
                    pCtx.fillStyle = '#000000'; pCtx.beginPath();
                    pCtx.arc(x_px, y_px, 0.4 * pxPerMmX, 0, Math.PI * 2); pCtx.fill();
                    if (c === 0) {
                        pCtx.fillStyle = '#ffffff'; pCtx.font = 'bold 22px Arial';
                        pCtx.fillText(r, cx - 32.5 * pxPerMmX, y_px);
                        pCtx.fillText(r, cx + 32.5 * pxPerMmX, y_px);
                    }
                }
            }
            
            const perfTex = new THREE.CanvasTexture(perfCanvas);
            perfTex.anisotropy = 16;
            const perfboardMatTextured = new THREE.MeshStandardMaterial({
                color: 0xffffff, map: perfTex, roughness: 0.9, metalness: 0.1
            });
            const perfMaterials = [
                perfboardMat, perfboardMat, perfboardMat, perfboardMat,
                perfboardMatTextured, perfboardMat
            ];

            const boardGeom = new THREE.BoxGeometry(69.5, 91.0, 1.6);
            const boardMesh = new THREE.Mesh(boardGeom, perfMaterials);
            perfboardGroup.add(boardMesh);

            const femaleHeaderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
            const dispHeaderLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 20.32, 9.0), femaleHeaderMat);
            dispHeaderLeft.position.set(-27.46, 17.11, 4.5);
            frontElectronicsGroup.add(dispHeaderLeft);

            const dispPcb = new THREE.Mesh(new THREE.BoxGeometry(57.0, 37.5, 1.6), pcbRedMat);
            dispPcb.position.set(-0.23, 16.25, 9.8);
            frontElectronicsGroup.add(dispPcb);

            const glass = new THREE.Mesh(new THREE.BoxGeometry(41.0, 30.6, 5.4), screenMat);
            glass.position.set(1.57, 16.70, 13.3);
            frontElectronicsGroup.add(glass);

            const espHeaderLeft = new THREE.Mesh(new THREE.BoxGeometry(2.54, 20.32, 9.0), femaleHeaderMat);
            espHeaderLeft.position.set(-22.38, -19.72, 4.5);
            frontElectronicsGroup.add(espHeaderLeft);
            
            const espHeaderRight = new THREE.Mesh(new THREE.BoxGeometry(2.54, 20.32, 9.0), femaleHeaderMat);
            espHeaderRight.position.set(-4.60, -19.72, 4.5);
            frontElectronicsGroup.add(espHeaderRight);

            const espPcb = new THREE.Mesh(new THREE.BoxGeometry(18.0, 22.5, 1.6), pcbBlueMat);
            espPcb.position.set(-13.49, -19.72, 9.8);
            frontElectronicsGroup.add(espPcb);

            const usbPort = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 5.4), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
            usbPort.position.set(-13.49, -30.0, 13.3);
            frontElectronicsGroup.add(usbPort);

            const sensHeader = new THREE.Mesh(new THREE.BoxGeometry(15.24, 2.54, 9.0), femaleHeaderMat);
            sensHeader.position.set(11.91, -18.45, 4.5);
            frontElectronicsGroup.add(sensHeader);

            const sensPcb = new THREE.Mesh(new THREE.BoxGeometry(14.0, 14.0, 1.6), pcbRedMat);
            sensPcb.position.set(11.91, -20.99, 9.8);
            frontElectronicsGroup.add(sensPcb);

            if (sensorType === 'electro') {
                const ferrite = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
                ferrite.rotation.z = Math.PI / 2;
                ferrite.position.set(11.91, -20.99, 13.0);
                frontElectronicsGroup.add(ferrite);
                
                const coil = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 12, 16), new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.8, roughness: 0.4 }));
                coil.rotation.z = Math.PI / 2;
                coil.position.set(11.91, -20.99, 13.0);
                frontElectronicsGroup.add(coil);
            } else if (sensorType === 'light') {
                const ldr = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3, 16), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
                ldr.rotation.x = Math.PI / 2;
                ldr.position.set(11.91, -20.99, 12.0);
                frontElectronicsGroup.add(ldr);
            } else if (sensorType === 'sound') {
                const mic = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 6, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
                mic.rotation.x = Math.PI / 2;
                mic.position.set(11.91, -20.99, 13.0);
                frontElectronicsGroup.add(mic);
            } else {
                const sensChip = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 2.0), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
                sensChip.position.set(11.91, -20.99, 11.6);
                frontElectronicsGroup.add(sensChip);
            }

            const sX = 31.0; const sY = 40.5;
            const shaftGeom = new THREE.CylinderGeometry(1.6, 1.6, 30.0, 16);
            shaftGeom.rotateX(Math.PI / 2);
            const headGeom = new THREE.CylinderGeometry(2.8, 2.8, 1.4, 16);
            headGeom.rotateX(Math.PI / 2);
            const nutGeom = new THREE.CylinderGeometry(2.7, 2.7, 2.0, 6);
            nutGeom.rotateX(Math.PI / 2);

            [[-sX, sY], [sX, sY], [-sX, -sY], [sX, -sY]].forEach(([cx, cy]) => {
                const fHead = new THREE.Mesh(headGeom, securityScrewMat);
                fHead.position.set(cx, cy, 19.5);
                frontScrewGroup.add(fHead);

                const shaft = new THREE.Mesh(shaftGeom, securityScrewMat);
                shaft.position.set(cx, cy, 5.5);
                frontScrewGroup.add(shaft);

                const bNut = new THREE.Mesh(nutGeom, securityScrewMat);
                bNut.position.set(cx, cy, -7.5);
                backScrewGroup.add(bNut);
            });

            // PVC Hose
            const hoseMat = new THREE.MeshPhysicalMaterial({
                color: 0x88ccff, transparent: true, opacity: 0.65, roughness: 0.2, transmission: 0.8, thickness: 2.0, clearcoat: 1.0
            });
            const hoseGeom = new THREE.CylinderGeometry(3.5, 3.5, 25.0, 16);
            const hose = new THREE.Mesh(hoseGeom, hoseMat);
            hose.position.set(-25.0, -47.5, 11.5); 
            powerCableGroup.add(hose);

            // Inner Power Wire
            const powerWireMat = new THREE.MeshStandardMaterial({ color: 0x880000 });
            const powerWire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 30.0, 8), powerWireMat);
            powerWire.position.set(-25.0, -45.0, 11.5);
            powerCableGroup.add(powerWire);
            
            // Steel Wire Loop
            const steelMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.9, roughness: 0.2 });
            const crimpGeom = new THREE.CylinderGeometry(2.0, 2.0, 5.0, 16);
            const crimp = new THREE.Mesh(crimpGeom, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
            crimp.position.set(-25.0, -32.0, 11.5);
            powerCableGroup.add(crimp);

            const steelPoints = [
                new THREE.Vector3(-25.5, -45, 11.5),
                new THREE.Vector3(-25.5, -32, 11.5),
                new THREE.Vector3(-26.0, -25, 11.5),
                new THREE.Vector3(-31.0, -29, 11.5),
                new THREE.Vector3(-34.5, -40.5, 11.5),
                new THREE.Vector3(-31.0, -44.0, 11.5),
                new THREE.Vector3(-24.5, -40.0, 11.5),
                new THREE.Vector3(-24.5, -32, 11.5)
            ];
            const steelPath = new THREE.CatmullRomCurve3(steelPoints);
            steelPath.curveType = 'chordal';
            steelPath.tension = 0.5;
            const steelGeom = new THREE.TubeGeometry(steelPath, 64, 0.5, 8, false);
            const steelWireMesh = new THREE.Mesh(steelGeom, steelMat);
            powerCableGroup.add(steelWireMesh);
        };

        buildCovers();
        buildPerforatedVarillas();
        buildPerfboardAndElectronics();

        return mainAssemblyGroup;
    }
};
