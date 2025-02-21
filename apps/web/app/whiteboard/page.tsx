"use client";

import { Canvas, Circle, Path, PencilBrush, Rect, Triangle } from "fabric";
import { Download, Eraser, Palette, Redo, Trash2, Undo } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

interface CustomCanvas extends Canvas {
  shapeType?: string;
}

export default function Whiteboard() {
  const canvasRef = useRef<CustomCanvas | null>(null);
  const [color, setColor] = useState("#000000");
  const userId = localStorage.getItem("userId");
  const isDrawingRef = useRef(false);
  const activeShapeRef = useRef<any>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const [linewidth, setLineWidth] = useState(3);
  const params = useSearchParams();
  const whiteboardId = params.get("whiteboardId") || "";
  const title = params.get("title") || "Name Your Canvas";
  const [name, setName] = useState(title);

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
          .filter(Boolean);
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
        socket.emit("update-whiteboard", whiteboardId, userId, shapeData);
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    socket.emit("join-room", whiteboardId);
    socket.emit("get-whiteboard", whiteboardId);

    socket.on("update-whiteboard", (updatedRoomId, incoming_userId, data) => {
      if (!canvasRef.current || incoming_userId === userId) return;

      try {
        canvasRef.current.clear();

        const objects = recreateObjectFromJSON(canvasRef.current, data);

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
      socket.emit("update-whiteboard", whiteboardId, userId, canvasData);
    };

    canvas.on("path:created", sendCanvasUpdate);

    window.addEventListener("beforeunload", () => {
      socket.emit(
        "leave-room",
        whiteboardId,
        userId,
        canvasRef.current?.toJSON(),
        name
      );
    });
    
    return () => {
      canvas.dispose();
      socket.off("update-whiteboard");
      socket.off("clear-whiteboard");
      socket.off("leave-room");
    };
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 ">
      <div className="max-w mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none transition-colors"
            />
            <div className="flex items-center gap-4">
              <select
                defaultValue={"pencil"}
                className="p-2 border border-gray-200 rounded-lg "
                onChange={(e) => {
                  if (canvasRef.current) {
                    const shape = e.target.value.toLowerCase();
                    canvasRef.current.isDrawingMode = shape === "pencil";
                    canvasRef.current.shapeType = shape;
                    canvasRef.current.selection = shape === "select";
                    const objects = canvasRef.current.getObjects();
                    objects.forEach(
                      (obj) => (obj.selectable = shape === "select")
                    );
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
                disabled={true}
                // onClick={handleUndo}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                // disabled={drawingHistory.length === 0}
              >
                <Undo className="w-6 h-6 text-gray-700" />
              </button>
              <button
                disabled={true}
                // onClick={handleRedo}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                // disabled={redoHistory.length === 0}
              >
                <Redo className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={() => {
                  if (canvasRef.current) {
                    canvasRef.current.clear();
                    socket.emit("clear-whiteboard", whiteboardId);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex items-center gap-2 ml-4">
                <Palette className="w-5 h-5 text-gray-700" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (canvasRef.current?.freeDrawingBrush) {
                      canvasRef.current.freeDrawingBrush.color = e.target.value;
                    }
                  }}
                  className="w-8 h-8 p-0 bg-transparent border-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <Eraser className="w-5 h-5 text-gray-700" />
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={linewidth}
                  onChange={(e) => {
                    if (!canvasRef.current?.freeDrawingBrush) return;
                    setLineWidth(parseInt(e.target.value));
                    canvasRef.current.freeDrawingBrush.width = parseInt(
                      e.target.value
                    );
                  }}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <canvas
              id="whiteboard"
              height={window.innerHeight}
              width={window.innerWidth}
              className="cursor-crosshair border"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            Create something amazing! Your ideas are automatically saved.
          </p>
        </div>
      </div>
    </div>
  );
}
