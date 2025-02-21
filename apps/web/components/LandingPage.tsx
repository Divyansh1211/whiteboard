"use client";

import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CanvasSkeleton } from "./CanvasSkeleton";
import { handleDelete } from "../app/gallery/page";

interface SavedCanvas {
  canvasId: string;
  title: string;
  thumbnail: string;
  lastModified: Date;
}

export function LandingPage({
  drawings,
  loading,
}: {
  drawings: SavedCanvas[];
  loading: boolean;
}) {
  const router = useRouter();

  

  const onOpenCanvas = (canvasId: string, title: string) => {
    router.push(`/whiteboard?whiteboardId=${canvasId}&title=${title}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">My Drawings</h1>
        <button
          onClick={() => {
            router.push(`/whiteboard?whiteboardId=${crypto.randomUUID()}`);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Canvas
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <CanvasSkeleton />
          <CanvasSkeleton />
          <CanvasSkeleton />
          <CanvasSkeleton />
          <CanvasSkeleton />
          <CanvasSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {Object.entries(drawings).length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm h-screen">
              <Pencil className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No drawings yet
              </h3>
              <p className="text-gray-500 text-center">
                Click the "New Canvas" button above to create your first
                masterpiece!
              </p>
            </div>
          ) : (
            Object.entries(drawings).map(([id, drawing]) => (
              <div
                key={id}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transform hover:scale-102 transition-transform duration-200"
              >
                {/* {drawing.canvasId} */}
                <div
                  className="aspect-video relative "
                  onClick={() => onOpenCanvas(drawing.canvasId, drawing.title)}
                >
                  <img
                    //   src={drawing.thumbnail}
                    alt={drawing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {drawing.title}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(drawing.canvasId, e)}
                      className="p-1 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(drawing.lastModified.toString())}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
