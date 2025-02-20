"use client";

import {
  Canvas,
  Circle,
  Path,
  PencilBrush,
  Rect,
  Triangle,
  util,
} from "fabric";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

interface CustomCanvas extends Canvas {
  shapeType?: string;
}

export default function Whiteboard() {
  const canvasRef = useRef<CustomCanvas | null>(null);
  const [color, setColor] = useState("#000000");
  const userId = useRef(Math.random().toString(36).substring(7));
  const roomId = "whiteboard1";
  const isDrawingRef = useRef(false);
  const activeShapeRef = useRef<any>(null);
  const startPointRef = useRef({ x: 0, y: 0 });

  const brushWidth = {
    Thin: 2,
    Medium: 5,
    Thick: 8,
  };

  useEffect(() => {
    const canvas = new Canvas("whiteboard", {
      isDrawingMode: true,
    }) as CustomCanvas;

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 3;
    canvasRef.current = canvas;

    const recreateObjectFromJSON = (canvas: CustomCanvas, data: any) => {
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        if (!parsedData.objects) {
          console.error("Invalid canvas data format");
          return [];
        }

        return parsedData.objects
          .map((object: any) => {
            switch (object.type.toLowerCase()) {
              case "circle":
                return new Circle(object);
              case "rect":
                return new Rect(object);
              case "triangle":
                return new Triangle(object);
              case "path":
                return new Path(object.path, object);
              default:
                console.log("Unknown shape type:", object.type);
                return null;
            }
          })
          .filter(Boolean); // Remove any null values
      } catch (error) {
        console.error("Error recreating objects:", error);
        return [];
      }
    };

    const createShape = (
      pointer: { x: number; y: number },
      shapeType: string
    ) => {
      let shape;
      const width = pointer.x - startPointRef.current.x;
      const height = pointer.y - startPointRef.current.y;

      switch (shapeType) {
        case "circle":
          shape = new Circle({
            left: startPointRef.current.x,
            top: startPointRef.current.y,
            radius: Math.abs(width) / 2,
            fill: "transparent",
            stroke: canvas.freeDrawingBrush?.color,
            strokeWidth: canvas.freeDrawingBrush?.width,
          });
          break;
        case "rectangle":
          shape = new Rect({
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
            width: Math.abs(width),
            height: Math.abs(height),
            fill: "transparent",
            stroke: canvas.freeDrawingBrush?.color,
            strokeWidth: canvas.freeDrawingBrush?.width,
          });
          break;
        case "triangle":
          shape = new Triangle({
            left: width > 0 ? startPointRef.current.x : pointer.x,
            top: height > 0 ? startPointRef.current.y : pointer.y,
            width: Math.abs(width),
            height: Math.abs(height),
            fill: "transparent",
            stroke: canvas.freeDrawingBrush?.color,
            strokeWidth: canvas.freeDrawingBrush?.width,
          });
          break;
        case "square":
          const size = Math.max(Math.abs(width), Math.abs(height));
          shape = new Rect({
            left:
              width > 0
                ? startPointRef.current.x
                : startPointRef.current.x - size,
            top:
              height > 0
                ? startPointRef.current.y
                : startPointRef.current.y - size,
            width: size,
            height: size,
            fill: "transparent",
            stroke: canvas.freeDrawingBrush?.color,
            strokeWidth: canvas.freeDrawingBrush?.width,
          });
          break;
      }
      return shape;
    };

    const handleMouseDown = (options: any) => {
      if (!canvas.isDrawingMode && canvas.shapeType !== "select") {
        isDrawingRef.current = true;
        const pointer = canvas.getPointer(options.e);
        startPointRef.current = pointer;
        const shape = createShape(pointer, canvas.shapeType!);
        if (shape) {
          canvas.remove(activeShapeRef.current);
          canvas.add(shape);
          activeShapeRef.current = shape;
          canvas.renderAll();
        }
      }
    };

    const handleMouseMove = (options: any) => {
      if (!isDrawingRef.current || canvas.isDrawingMode) return;

      const pointer = canvas.getPointer(options.e);

      if (activeShapeRef.current) {
        const width = pointer.x - startPointRef.current.x;
        const height = pointer.y - startPointRef.current.y;

        switch (canvas.shapeType) {
          case "circle":
            activeShapeRef.current.set({
              radius: Math.abs(width) / 2,
            });
            break;
          case "rectangle":
          case "triangle":
            activeShapeRef.current.set({
              width: Math.abs(width),
              height: Math.abs(height),
              left: width > 0 ? startPointRef.current.x : pointer.x,
              top: height > 0 ? startPointRef.current.y : pointer.y,
            });
            break;
          case "square":
            const size = Math.max(Math.abs(width), Math.abs(height));
            activeShapeRef.current.set({
              width: size,
              height: size,
              left:
                width > 0
                  ? startPointRef.current.x
                  : startPointRef.current.x - size,
              top:
                height > 0
                  ? startPointRef.current.y
                  : startPointRef.current.y - size,
            });
            break;
        }
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (!canvas.isDrawingMode && isDrawingRef.current) {
        isDrawingRef.current = false;
        activeShapeRef.current = null;

        const shapeData = JSON.stringify(canvasRef.current?.toJSON());
        socket.emit("update-whiteboard", roomId, userId.current, shapeData);
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    socket.emit("join-room", roomId);
    socket.emit("get-whiteboard", roomId);

    socket.on("update-whiteboard", (updatedRoomId, incoming_userId, data) => {
      if (!canvasRef.current || incoming_userId === userId.current) return;

      try {
        // Clear existing canvas
        canvasRef.current.clear();

        // Recreate all objects
        const objects = recreateObjectFromJSON(canvasRef.current, data);

        // Add all objects to canvas
        objects.forEach((obj: any) => {
          if (obj) {
            canvasRef.current?.add(obj);
          }
        });

        canvasRef.current.renderAll();
      } catch (error) {
        console.error("Error processing canvas update:", error);
      }
    });
    const sendCanvasUpdate = () => {
      if (!canvasRef.current) return;
      const canvasData = JSON.stringify(canvasRef.current.toJSON());
      socket.emit("update-whiteboard", roomId, userId.current, canvasData);
    };

    canvas.on("path:created", sendCanvasUpdate);

    return () => {
      canvas.dispose();
      socket.off("update-whiteboard");
      socket.off("clear-whiteboard");
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <canvas id="whiteboard" width="800" height="500" className="border" />
      <div className="flex justify-between space-x-4 w-[800px]">
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
        <select
          onChange={(e) => {
            if (canvasRef.current?.freeDrawingBrush) {
              canvasRef.current.freeDrawingBrush.width =
                brushWidth[e.target.value as keyof typeof brushWidth] ?? 3;
            }
          }}
        >
          <option>Thin</option>
          <option>Medium</option>
          <option>Thick</option>
        </select>
        <select
          onChange={(e) => {
            if (canvasRef.current) {
              const shape = e.target.value.toLowerCase();
              canvasRef.current.isDrawingMode = shape === "pencil";
              canvasRef.current.shapeType = shape;

              // Enable/disable object selection based on mode
              canvasRef.current.selection = shape === "select";
              const objects = canvasRef.current.getObjects();
              objects.forEach((obj) => (obj.selectable = shape === "select"));
            }
          }}
        >
          <option value="select">Select</option>
          <option value="pencil">Pencil</option>
          <option value="circle">Circle</option>
          <option value="rectangle">Rectangle</option>
          <option value="triangle">Triangle</option>
          <option value="square">Square</option>
        </select>
        <button
          type="button"
          onClick={() => {
            if (canvasRef.current) {
              canvasRef.current.clear();
              console.log(canvasRef.current.toJSON());
              socket.emit("clear-whiteboard", roomId);
            }
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
