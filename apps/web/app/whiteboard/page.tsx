"use client";

import { Canvas, Path, PencilBrush, Rect } from "fabric";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Whiteboard() {
  const canvasRef = useRef<Canvas | null>(null);
  const [color, setColor] = useState("#000000");
  const userId = useRef(Math.random().toString(36).substring(7));
  const roomId = "whiteboard1";

  useEffect(() => {
    const canvas = new Canvas("whiteboard", {
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 3;
    canvasRef.current = canvas;

    socket.emit("join-room", roomId);
    socket.emit("get-whiteboard", roomId);

    socket.on("update-whiteboard", (updatedRoomId, incoming_userId, data) => {
      if (!canvasRef.current || incoming_userId === userId.current) return;

      try {
        // Parse the incoming data
        const incomingJson = JSON.parse(data);

        // Get only the new path (last object in the array)
        if (incomingJson.objects && incomingJson.objects.length > 0) {
          const newPath = incomingJson.objects[incomingJson.objects.length - 1];

          // Add the new path to the existing canvas
          canvasRef.current.add(
            new Path(newPath.path, {
              ...newPath,
              stroke: newPath.stroke,
              strokeWidth: newPath.strokeWidth,
            })
          );

          canvasRef.current.renderAll();
        }
      } catch (error) {
        console.error("Error processing canvas update:", error);
      }
    });

    canvas.on("path:created", () => {
      if (!canvasRef.current) return;

      // Get the last created path
      const paths = canvasRef.current.getObjects();
      const lastPath = paths[paths.length - 1];

      // Create a JSON with just the new path
      const pathData = {
        objects: [lastPath],
        background: canvasRef.current.backgroundColor,
      };

      const canvasData = JSON.stringify(pathData);
      socket.emit("update-whiteboard", roomId, userId.current, canvasData);
    });

    return () => {
      canvas.dispose();
      socket.off("update-whiteboard");
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <canvas id="whiteboard" width="800" height="500" className="border" />
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          if (canvasRef.current?.freeDrawingBrush) {
            canvasRef.current.freeDrawingBrush.color = e.target.value;
          }
        }}
      />
    </div>
  );
}