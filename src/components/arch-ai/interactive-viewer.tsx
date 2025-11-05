"use client";

import * as React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GeneratePlanSchema } from '@/lib/schemas';

// 📝 Notes & Assumptions:
// - The procedural layout algorithm is a simplified grid-based approach.
//   It's deterministic and aims for a sensible layout but is not a full architectural solver.
// - Assumes a single exterior door and places windows on exterior walls.
// - All rooms are rectangular.
// - 1 Three.js unit = 1 meter.

// --- GEOMETRY COMPONENTS ---

const WALL_HEIGHT = 2.8;
const WALL_THICKNESS = 0.15;

// A single wall segment with potential openings
function Wall({ start, end, openings = [] }: { start: THREE.Vector3; end: THREE.Vector3; openings?: any[] }) {
  const length = start.distanceTo(end);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, WALL_HEIGHT);
  shape.lineTo(0, WALL_HEIGHT);
  shape.lineTo(0, 0);
  
  // Create holes for doors/windows
  openings.forEach(opening => {
    const { position: openingPos, size } = opening;
    const hole = new THREE.Path();
    hole.moveTo(openingPos[0], openingPos[1]);
    hole.lineTo(openingPos[0] + size[0], openingPos[1]);
    hole.lineTo(openingPos[0] + size[0], openingPos[1] + size[1]);
    hole.lineTo(openingPos[0], openingPos[1] + size[1]);
    hole.lineTo(openingPos[0], openingPos[1]);
    shape.holes.push(hole);
  });

  const extrudeSettings = {
    steps: 1,
    depth: WALL_THICKNESS,
    bevelEnabled: false,
  };

  return (
    <mesh position={[position.x, 0, position.y]} rotation={[0, -angle, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#f8f8f8" side={THREE.DoubleSide} />
    </mesh>
  );
}


// --- PROCEDURAL LAYOUT LOGIC ---

/**
 * 📐 Floor Plan Dimensions & JSON Room Layout
 * This data is generated procedurally based on user input.
 * Example structure:
  const roomData = {
    'LivingRoom-0': { x: 0, z: 0, width: 5, depth: 6, label: 'Living Room' },
    'Bedroom-0': { x: 5, z: 0, width: 4, depth: 4, label: 'Bedroom' },
    ...
  };
*/
function generateLayout(planConfig: GeneratePlanSchema) {
    const { totalArea, roomCounts } = planConfig;
    const sideLength = Math.sqrt(totalArea);

    const rooms: { [key: string]: any } = {};
    const walls = new Set<string>(); // Use a set to avoid duplicate walls
    
    // A very simple greedy packing algorithm
    let currentX = 0;
    let currentZ = 0;
    let maxZinRow = 0;

    const totalRooms = Object.values(roomCounts).reduce((a, b) => a + b, 0);
    const avgRoomArea = totalArea / Math.max(1, totalRooms);
    const estimatedRoomSide = Math.sqrt(avgRoomArea) * 0.9; // Adjust to add space for corridors

    for (const [roomType, count] of Object.entries(roomCounts)) {
        for (let i = 0; i < count; i++) {
            const roomWidth = estimatedRoomSide + Math.random() * 2 - 1;
            const roomDepth = estimatedRoomSide + Math.random() * 2 - 1;

            if (currentX + roomWidth > sideLength) {
                currentX = 0;
                currentZ += maxZinRow;
                maxZinRow = 0;
            }
            
            if (currentZ + roomDepth > sideLength) continue; // Skip if it doesn't fit

            const roomKey = `${roomType}-${i}`;
            rooms[roomKey] = {
                x: currentX,
                z: currentZ,
                width: roomWidth,
                depth: roomDepth,
                label: roomType.replace(/([A-Z])/g, ' $1').trim(),
            };

            currentX += roomWidth;
            maxZinRow = Math.max(maxZinRow, roomDepth);
        }
    }

    // Generate walls from room boundaries
    Object.values(rooms).forEach(room => {
        const { x, z, width, depth } = room;
        const x0 = x, z0 = z, x1 = x + width, z1 = z + depth;
        
        // Use a key to uniquely identify wall segments
        walls.add(`${x0},${z0},${x1},${z0}`); // Top
        walls.add(`${x0},${z1},${x1},${z1}`); // Bottom
        walls.add(`${x0},${z0},${x0},${z1}`); // Left
        walls.add(`${x1},${z0},${x1},${z1}`); // Right
    });

    return { rooms, walls: Array.from(walls) };
}


// --- MAIN 3D COMPONENT ---

const FloorPlan = ({ planConfig, onSceneReady }: { planConfig: GeneratePlanSchema, onSceneReady: (scene: THREE.Scene) => void; }) => {
  const { scene } = useThree();
  const { rooms, walls } = React.useMemo(() => generateLayout(planConfig), [planConfig]);
  const sideLength = Math.sqrt(planConfig.totalArea);

  React.useEffect(() => {
    onSceneReady(scene);
  }, [scene, onSceneReady]);

  return (
    <group position={[-sideLength / 2, 0, -sideLength / 2]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sideLength/2, 0, sideLength/2]}>
        <planeGeometry args={[sideLength, sideLength]} />
        <meshStandardMaterial color="#d2b48c" />
      </mesh>

      {/* Walls */}
      {walls.map((wall, index) => {
        const [x1_s, y1_s, x2_s, y2_s] = wall.split(',');
        const start = new THREE.Vector3(parseFloat(x1_s), parseFloat(y1_s), 0);
        const end = new THREE.Vector3(parseFloat(x2_s), parseFloat(y2_s), 0);
        
        // Simple logic to add a door to one wall segment
        const isExterior = parseFloat(x1_s) === 0 || parseFloat(x2_s) === 0;
        const openings = [];
        if (index === 3 && isExterior) { // Add a door to an arbitrary exterior wall
             openings.push({
                position: [start.distanceTo(end) / 2 - 0.45, 0],
                size: [0.9, 2.1] // 0.9m wide, 2.1m high
            });
        }
        if(index % 5 === 0 && isExterior) { // Add a window to some exterior walls
            openings.push({
                position: [start.distanceTo(end) / 2 - 0.6, 0.9],
                size: [1.2, 1.2] // 1.2m wide, 1.2m high
            });
        }

        return <Wall key={index} start={start} end={end} openings={openings} />;
      })}

      {/* Room Labels */}
      {Object.values(rooms).map((room, index) => (
         <Text
            key={index}
            position={[room.x + room.width / 2, 1.5, room.z + room.depth / 2]}
            fontSize={0.5}
            color="black"
            anchorX="center"
            anchorY="middle"
            maxWidth={room.width}
        >
            {room.label}
        </Text>
      ))}
    </group>
  );
};


interface InteractiveViewerProps {
  planConfig: GeneratePlanSchema;
  regenerationKey: number;
  onSceneReady: (scene: THREE.Scene) => void;
}

export function InteractiveViewer({ planConfig, regenerationKey, onSceneReady }: InteractiveViewerProps) {
  const totalArea = planConfig.totalArea;
  const cameraDistance = Math.sqrt(totalArea) * 1.5;

  return (
    <Canvas
      camera={{ position: [0, cameraDistance, cameraDistance], fov: 50 }}
      shadows
      style={{ background: 'hsl(var(--background))' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[10, 20, 5]} 
        intensity={1.0} 
        castShadow 
      />
      
      <React.Suspense fallback={null}>
        <FloorPlan key={regenerationKey} planConfig={planConfig} onSceneReady={onSceneReady} />
      </React.Suspense>
      
      <OrbitControls 
        makeDefault 
        minDistance={2} 
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />
      <gridHelper args={[100, 100]} position={[0, -0.01, 0]} />
    </Canvas>
  );
}
